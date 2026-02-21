import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'


export interface ImportJobResponse {
    message: string,
    jobId: string
}

export interface ExportJobResponse {
    message: string,
    jobId: string,
    criteria: string
}

export interface JobStatusResponse {
    jobId: string,
    state: string,
    progress: number,
    result? : {
        success:boolean
        total?: number,
        imported?: number,
        failed?: number,
        fileName: string,
        filePath?: string;
        error?: string;
    }
}

@Injectable({
    providedIn: 'root'
})
export class BatchService {

    private baseUrl = 'http://localhost:3000/batch';

    constructor( private http: HttpClient) { }

    importVehicles(file: File): Observable<ImportJobResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ImportJobResponse>(`${this.baseUrl}/import`, formData);
    }

    getJobStatus(jobId: string, queueType: 'import' | 'export'): Observable<JobStatusResponse> {
        return this.http.post<JobStatusResponse>(`${this.baseUrl}/job-status/${jobId}`, {
            jobId,
            queueType
        });
    }

    exportVehicles(minAge?: number, exportAll: boolean = false): Observable<ExportJobResponse> {
        const body = { minAge, exportAll };
        return this.http.post<ExportJobResponse>(`${this.baseUrl}/export`, body);
    }
}