import { Process, Processor } from '@nestjs/bull';
import * as Bull from 'bull';
import { Injectable } from '@nestjs/common';
import { VehicleService } from '../vehicle/vehicle.service';
// import { NotificationClientService } from '../notification/notification-client.service';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { Vehicle } from '../vehicle/entities/vehicle.entity'

interface ExportJobData {
  minAge?: number;
  userId?: string;
  exportAll?: boolean;
}

@Processor('export')
@Injectable()
export class ExportProcessor {
  constructor(
    private readonly vehicleService: VehicleService,
    //private readonly notificationClient: NotificationClientService,
  ) { }

  @Process('export-vehicles')
  async handleExport(job: Bull.Job<ExportJobData>) {
    const { minAge, exportAll } = job.data;

    try {
      await job.progress(5);
      console.log(`Starting export with criteria: ${exportAll ? 'all vehicles' : `age >= ${minAge} years`}`);

      // Create exports directory if it doesn't exist
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // windows does not allow cemicolon in filenames
      const fileName = `vehicles_export_${timestamp}.csv`;
      const filePath = path.join(exportsDir, fileName);

      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'firstName', title: 'First Name' },
          { id: 'lastName', title: 'Last Name' },
          { id: 'email', title: 'Email' },
          { id: 'carMake', title: 'Car Make' },
          { id: 'carModel', title: 'Car Model' },
          { id: 'vin', title: 'VIN' },
          { id: 'manufacturedDate', title: 'Manufactured Date' },
          { id: 'ageOfVehicle', title: 'Age of Vehicle (Years)' },
        ],
      });

      // Helper function to safely format dates
      const formatDate = (date: any): string => {
        if (!date) return '';
        if (typeof date === 'string') return date.split('T')[0];
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return String(date);
      };

      // Fetch and write in chunks to save memory
      const CHUNK_SIZE = 1000;
      let offset = 0;
      let hasMore = true;
      let totalExported = 0;

      while (hasMore) {
        const vehicles = await this.vehicleService.findChunkForExport(CHUNK_SIZE, offset, minAge, exportAll);

        if (vehicles.length === 0) {
          hasMore = false;
          break;
        }

        const records = vehicles.map((vehicle) => ({
          id: vehicle.id,
          firstName: vehicle.firstName,
          lastName: vehicle.lastName,
          email: vehicle.email,
          carMake: vehicle.carMake,
          carModel: vehicle.carModel,
          vin: vehicle.vin,
          manufacturedDate: formatDate(vehicle.manufacturedDate),
          ageOfVehicle: vehicle.ageOfVehicle,
        }));

        await csvWriter.writeRecords(records);

        totalExported += vehicles.length;
        offset += CHUNK_SIZE;

        const progress = Math.min(10 + Math.floor((totalExported / (totalExported + CHUNK_SIZE)) * 80), 90);
        await job.progress(progress);

        if (vehicles.length < CHUNK_SIZE) {
          hasMore = false;
        }
      }

      await job.progress(100);
      console.log(`Successfully exported ${totalExported} vehicles to ${fileName}`);

      const result = {
        success: true,
        total: totalExported,
        fileName,
        filePath,
      };

      return result;
    } catch (error) {
      console.error('Export job failed:', error);
      throw error;
    }
  }
}
