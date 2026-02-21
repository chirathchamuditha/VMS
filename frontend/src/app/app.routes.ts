import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { VehicleComponent } from './components/Vehicle/vehicle.component';
import { ServiceRecComponent } from './components/ServiceRec/serviceRec.component';
import { ImportExportComponent } from './components/importExport/importExport.component';

export const routes: Routes = [
    { path: '', redirectTo: '', pathMatch: 'full' },
    { path: 'vehicles', component: VehicleComponent },
    { path: 'serviceRecords', component: ServiceRecComponent },
    { path: 'importExport', component: ImportExportComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule { }
