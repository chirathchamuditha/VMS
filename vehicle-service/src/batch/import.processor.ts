import { Process, Processor } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { CreateVehicleInput } from "src/vehicle/dto/create-vehicle.input";
import { VehicleService } from "src/vehicle/vehicle.service";
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import csv from 'csv-parser';
import Bull from "bull";

interface ImportJobData {
    filePath: string;
    fileType: 'csv' | 'excel';
}

@Processor('import')
@Injectable()
export class ImportProcessor {

    constructor(
        private readonly vehicleService: VehicleService
    ) { }

    @Process('import-vehicles')
    async handlingImports(job: Bull.Job<ImportJobData>) {
        const { filePath, fileType } = job.data
        const jobId = job.id


        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`)
            }

            const filestat = fs.statSync(filePath)
            await job.progress(10)

            let vehicles: CreateVehicleInput[] = []

            if (fileType === 'csv') {
                vehicles = await this.parseCSV(filePath)
            } else if (fileType === 'excel') {
                vehicles = await this.parseExcelFile(filePath)
            } else {
                throw new Error(`Unsupported file type: ${fileType}`)
            }

            await job.progress(50)

            const importedVehicles = await this.vehicleService.bulkCreate(
                vehicles,
                async (processed, total, imported, failed) => {
                    const importProgress = 50 + ((processed / total) * 50)
                    await job.progress(Math.round(importProgress))
                }
            )

            await job.progress(100)

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error
                }
            }


            const result = {
                success: true,
                total: vehicles.length,
                imported: importedVehicles.length,
                failed: vehicles.length - importedVehicles.length,
            };


            return result

        } catch (error) {
            console.error

            const fileExists = fs.existsSync(filePath);

            if (fileExists) {
                try {
                    const stats = fs.statSync(filePath);
                } catch (e) {
                    console.error
                }
            }

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error
                }
            }
            throw error;
        }

    }

    private async parseExcelFile(filePath: string): Promise<CreateVehicleInput[]> {
        const vehicles: CreateVehicleInput[] = [];
        try {
            const excel = new ExcelJS.Workbook();
            await excel.xlsx.readFile(filePath);
            const worksheet = excel.worksheets[0];

            if (!worksheet) throw new Error('No worksheet found in Excel file');

            const headers: string[] = [];
            worksheet.getRow(1).eachCell((cell) => {
                const header = cell.value as string;
                if (header) headers.push(header.trim());
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header
                const rowData: any = {};
                row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) rowData[header] = cell.value;
                });

                try {
                    const dateValue = rowData.manufactured_date || rowData.manufacturedDate || rowData['Manufactured Date'] || rowData.date;
                    const parsedDate = this.parseExcelDate(dateValue);

                    const vehicle: CreateVehicleInput = {
                        firstName: rowData.first_name || rowData.firstName || rowData['First Name'] || '',
                        lastName: rowData.last_name || rowData.lastName || rowData['Last Name'] || '',
                        email: rowData.email || rowData.Email || '',
                        carMake: rowData.car_make || rowData.carMake || rowData['Car Make'] || rowData.make || '',
                        carModel: rowData.car_model || rowData.carModel || rowData['Car Model'] || rowData.model || '',
                        vin: rowData.vin || rowData.VIN || rowData.Vin || '',
                        manufacturedDate: parsedDate as any,
                    };

                    if (!vehicle.vin) return; // skip invalid row
                    vehicles.push(vehicle);

                } catch (err) {
                    console.error('Error parsing row', rowNumber, err);
                }
            });

            return vehicles;

        } catch (error) {
            console.error('Error reading Excel file:', error);
            return vehicles; // return empty array if something fails
        }
    }

    private parseExcelDate(value: any): string {
        if (!value) return '';

        // If it's already a Date object
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }

        // If it's an Excel serial date number (days since 1900-01-01)
        if (typeof value === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            const days = value - 2; // Excel incorrectly considers 1900 a leap year
            const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
            return date.toISOString().split('T')[0];
        }

        // If it's a string, return as-is
        if (typeof value === 'string') {
            return value;
        }

        return '';
    }


    private async parseCSV(filePath: string): Promise<CreateVehicleInput[]> {
        return new Promise((resolve, reject) => {
            const vehicles: CreateVehicleInput[] = [];
            let rowCount = 0;

            fs.createReadStream(filePath)
                .on('error', (error) => {
                    reject(error);
                })
                .pipe(csv())
                .on('data', (row) => {
                    rowCount++;
                    try {
                        const vehicle: CreateVehicleInput = {
                            firstName: row.first_name || row.firstName || '',
                            lastName: row.last_name || row.lastName || '',
                            email: row.email || '',
                            carMake: row.car_make || row.carMake || '',
                            carModel: row.car_model || row.carModel || '',
                            vin: row.vin || '',
                            manufacturedDate: row.manufactured_date || row.manufacturedDate || '',
                        };

                        // Skip rows without VIN
                        if (!vehicle.vin) return;

                        vehicles.push(vehicle);

                    } catch (error) {
                        // Skip row if parsing fails
                        return;
                    }
                })
                .on('end', () => {
                    resolve(vehicles);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }



}