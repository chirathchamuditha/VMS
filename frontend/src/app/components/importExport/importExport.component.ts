import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterOutlet } from "@angular/router";
import { NgxSonnerToaster, toast } from "ngx-sonner";
import { BatchService } from "../../services/batch.service";
import { interval, Subscription } from "rxjs";


@Component({
    selector: 'app-import-export',
    standalone: true,
    templateUrl: './importExport.component.html',
    imports: [RouterOutlet, CommonModule, FormsModule, NgxSonnerToaster]
})


export class ImportExportComponent implements OnDestroy {
    title = 'frontend';

    showImportModal: boolean = false;
    showExportModal: boolean = false
    selectedFile: File | null = null;
    exportCriteria: 'all' | '1year' | '3years' | '5years' | '10years' = 'all';
    currentJobId: string | null = null;
    currentJobType: 'import' | 'export' | null = null;
    jobProgress: number = 0;
    jobStatus: string = '';
    showJobProgress: boolean = false;
    jobResult: any = null;
    error: string | null = null;
    private statusPollingSubscription: Subscription | null = null;

    constructor(private batchService: BatchService) { }

    user = {
        username: 'Chirath',
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    openImportModal(): void {
        this.showImportModal = true;
        this.selectedFile = null;
        this.error = null; 
    }

    closeImportModal(): void {
        this.showImportModal = false;
        this.selectedFile = null;
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            const allowedTypes = [
                'text/csv', 
                'application/vnd.ms-excel', 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

            if (allowedTypes.includes(file.type)) {
                this.selectedFile = file;
                this.error = null;
            } else {
                this.error = 'Invalid file type. Please select a CSV or Excel file.';
                this.selectedFile = null;
            }
        }
    }

    uploadImportFile(): void {
      if (!this.selectedFile) {
        this.error = 'Please select a file';
        return;
      }

      this.error = null;

      this.batchService.importVehicles(this.selectedFile).subscribe({
        next: (response) => {
          console.log('Import job queued:', response);
          this.currentJobId = response.jobId;
          this.currentJobType = 'import';
          this.closeImportModal();
          this.showJobProgress = true;
          this.jobStatus = 'Queued';
          this.jobProgress = 0;
          this.startPolling();
          toast.success('File uploaded successfully. Import job has been queued.');
        },
        error: (err) => {
          console.error('Import error:', err);
          this.error = err.error?.message || 'Failed to upload file';
          toast.error('Failed to upload file: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }

    private startPolling(): void {
      this.stopPolling(); // Clear any existing polling
      
      this.statusPollingSubscription = interval(1000).subscribe(() => {
        if (this.currentJobId && this.currentJobType) {
          this.batchService.getJobStatus(this.currentJobId, this.currentJobType).subscribe({
            next: (status) => {
              this.jobStatus = status.state;
              this.jobProgress = status.progress || 0;
              
              if (status.state === 'completed') {
                this.jobResult = status.result;
                this.stopPolling();
                
                if (status.result?.success) {
                  toast.success(`Import completed! Imported: ${status.result?.imported}, Failed: ${status.result?.failed}`);
                } else {
                  toast.error(`Import failed: ${status.result?.error || 'Unknown error'}`);
                }
              } else if (status.state === 'failed') {
                this.stopPolling();
                toast.error('Import job failed');
              }
            },
            error: (err) => {
              console.error('Error polling job status:', err);
            }
          });
        }
      });
    }

    private stopPolling(): void {
      if (this.statusPollingSubscription) {
        this.statusPollingSubscription.unsubscribe();
        this.statusPollingSubscription = null;
      }
    }

    closeJobProgress(): void {
      this.showJobProgress = false;
      this.stopPolling();
      this.currentJobId = null;
      this.currentJobType = null;
    }

  openExportModal(): void {
    this.showExportModal = true;
    this.exportCriteria = 'all';
    this.error = null; 
  }

  closeExportModal(): void {
    this.showExportModal = false;
  }

  exportVehicles(): void {
    this.error = null;

    let minAge: number | undefined;
    let exportAll = false;

    switch (this.exportCriteria) {
      case 'all':
        exportAll = true;
        break;
      case '1year':
        minAge = 1;
        break;
      case '3years':
        minAge = 3;
        break;
      case '5years':
        minAge = 5;
        break;
      case '10years':
        minAge = 10;
        break;
    }

    this.batchService.exportVehicles(minAge, exportAll).subscribe({
      next: (response) => {
        console.log('Export job queued:', response);
        this.currentJobId = response.jobId;
        this.currentJobType = 'export';
        this.closeExportModal();
        this.showJobProgress = true;
        this.jobStatus = 'Queued';
        this.jobProgress = 0;
      },
      error: (err) => {
        console.error('Export error:', err);
        this.error = err.error?.message || 'Failed to start export';
      }
    });
  }

}