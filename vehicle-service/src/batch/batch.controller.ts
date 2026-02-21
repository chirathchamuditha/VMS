import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import express from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as Bull from 'bull';


@Controller('batch')
export class BatchController {
  constructor(
    @InjectQueue('import') private importQueue: Bull.Queue,
    @InjectQueue('export') private exportQueue: Bull.Queue,
  ) { }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDirectory = path.join(process.cwd(), 'uploads');
          console.log(`[BatchController] Upload destination: ${uploadDirectory}`);
          try {
            if (!fs.existsSync(uploadDirectory)) {
              fs.mkdirSync(uploadDirectory, { recursive: true });
            }
            cb(null, uploadDirectory);
          } catch (err) {
            console.error(`[BatchController] Error creating upload dir:`, err);
            throw new BadRequestException('Failed to create upload directory');
          }
        },

        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}-${file.originalname}`;
          console.log(`[BatchController] Generated filename: ${filename}`);
          cb(null, filename);
        },
      }),
      
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV and Excel files are allowed'), false);
        }
      },
    }),
  )
  async importVehicles(@UploadedFile() file: Express.Multer.File) {
    console.log(`[BatchController] Received import request. File:`, file?.originalname);
    if (!file) {
      console.error(`[BatchController] No file uploaded`);
      throw new BadRequestException('No file uploaded');
    }

    try {
      const fileType = file.mimetype === 'text/csv' ? 'csv' : 'excel';
      console.log(`[BatchController] File details:`, {
        path: file.path,
        type: fileType,
        mimetype: file.mimetype,
        size: file.size
      });
      console.log(`[BatchController] Adding job to import queue...`);

      const job = await this.importQueue.add('import-vehicles', {
        filePath: file.path,
        fileType,
      });

      console.log(`[BatchController] Job added successfully: ${job.id}`);
      return {
        message: 'Import job queued successfully',
        jobId: job.id,
      };
    } catch (err) {
      console.error(`[BatchController] Error adding job to queue:`, err);
      console.error(`[BatchController] Error stack:`, err.stack);

      // Cleanup file if job creation fails
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`[BatchController] Cleaned up file after error`);
        } catch (cleanupErr) {
          console.error(`[BatchController] Failed to cleanup file:`, cleanupErr);
        }
      }

      throw new BadRequestException(err.message || 'Failed to queue import job');
    }
  }

  @Post('export')
  async exportVehicles(@Body() exportCriteria: { minAge?: number; exportAll?: boolean }) {
    const { minAge, exportAll } = exportCriteria;

    if (!exportAll && (minAge === undefined || minAge < 0)) {
      throw new BadRequestException('Please provide a valid minimum age or set exportAll to true');
    }

    try {
      // Ensure exports directory exists proactively
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const job = await this.exportQueue.add('export-vehicles', {
        minAge,
        exportAll: exportAll || false,
      });

      console.log(`[BatchController] Export job added: ${job.id}`);
      return {
        message: 'Export job queued successfully',
        jobId: job.id,
        criteria: exportAll ? 'All vehicles' : `Vehicles with age >= ${minAge} years`,
      };
    } catch (err) {
      console.error(`[BatchController] Error adding export job:`, err);
      throw err;
    }
  }

  @Post('job-status/:jobId')
  async getJobStatus(@Body() body: { jobId: string; queueType: 'import' | 'export' }) {
    const { jobId, queueType } = body;
    const queue = queueType === 'import' ? this.importQueue : this.exportQueue;

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      jobId: job.id,
      state,
      progress,
      result,
    };
  }

  @Get('download/:filename')
  async downloadExport(@Param('filename') filename: string, @Res() res: express.Response) {
    try {
      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new BadRequestException('Invalid filename');
      }

      const filePath = path.join(process.cwd(), 'exports', filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Export file not found');
      }

      console.log(`[BatchController] Downloading file: ${filename}`);

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err) {
      console.error(`[BatchController] Error downloading file:`, err);
      throw err;
    }
  }
}
