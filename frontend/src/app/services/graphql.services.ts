import { Injectable } from "@angular/core";
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from "rxjs";
import { PaginatedVehiclesResponse, Vehicle } from "../models/vehicle.model";
import { ServiceRecord } from "../models/service.model";

const GET_VEHICLES =  gql`
    query GetVehicles($pagination: PaginationInput) {
    pageswithVehicles(pagination: $pagination) {
      vehicles {
        id
        firstName
        lastName
        email
        carMake
        carModel
        vin
        manufacturedDate
        ageOfVehicle
      }
      total
      page
      limit
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

const SEARCH_VEHICLES = gql`
  query SearchVehicles($search: SearchInput!, $pagination: PaginationInput) {
    searchVehicleswithPagination(search: $search, pagination: $pagination) {
      vehicles {
        id
        firstName
        lastName
        email
        carMake
        carModel
        vin
        manufacturedDate
        ageOfVehicle
      }
      total
      page
      limit
      totalPages
      hasNextPage
      hasPreviousPage
    }
  }
`;

const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle($updatedVehicleInput: UpdatedVehicleInput!) {
    updateVehicle(updatedVehicleInput: $updatedVehicleInput) {
      id
      firstName
      lastName
      email
      carMake
      carModel
      vin
      manufacturedDate
      ageOfVehicle
    }
  }
`;

const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($id: String!) {
    deleteVehicle(id: $id) {
      id
      firstName
      lastName
      email
      carMake
      carModel
      vin
      manufacturedDate
      ageOfVehicle
    }
  }
`;

const GET_SERVICE_RECORDS_BY_VIN = gql`
  query getServiceRecordsByVin($vin: String!) {
    serviceRecordsByVin(vin: $vin) {
      id
      vin
      serviceType
      description
      cost
      serviceDate
      serviceProvider
      technician
      nextServiceDate
    }
  }
`;
const CREATE_SERVICE_RECORD = gql`
  mutation CreateServiceRecord($createServiceRecordInput: CreateServiceRecordInput!) {
    createServiceRecord(createServiceRecordInput: $createServiceRecordInput) {
      id
      vin
      serviceType
      description
      cost
      serviceDate
      serviceProvider
      technician
      nextServiceDate
    }
  }
`;

const UPDATE_SERVICE_RECORD = gql`
  mutation UpdateServiceRecord($updateServiceRecordInput: UpdateServiceInput!) {
    updateServiceRecord(updateServiceRecordInput: $updateServiceRecordInput) {
      id
      vin
      serviceType
      description
      cost
      serviceDate
      serviceProvider
      technician
      nextServiceDate
    }
  }
`;

const DELETE_SERVICE_RECORD = gql`
  mutation DeleteServiceRecord($id: ID!) {
    deleteServiceRecord(id: $id) {
      id
    }
  }
`;

@Injectable({
    providedIn:'root'
})
export class GraphQLService {

    constructor( private apollo: Apollo) { }

    getVehicles(page: number = 1, limit: number = 100): Observable<PaginatedVehiclesResponse> {
    return this.apollo
      .query<{ pageswithVehicles: PaginatedVehiclesResponse }>({
        query: GET_VEHICLES,
        variables: { pagination: { page, limit } },
        fetchPolicy: 'network-only'
      })
      .pipe(
        map(result => {
          // Using optional chaining and nullish coalescing
          const data = result.data?.pageswithVehicles;
          if (!data) {
            throw new Error('No vehicles data received');
          }
          return data;
        })
      );
  }

    searchVehicles(model: string, page: number = 1, limit: number = 100): Observable<PaginatedVehiclesResponse> {
    return this.apollo
      .query<{ searchVehicleswithPagination: PaginatedVehiclesResponse }>({
        query: SEARCH_VEHICLES,
        variables: {
          search: { model },
          pagination: { page, limit }
        },
        fetchPolicy: 'network-only'
      })
      .pipe(
        map(result => {
          // Using optional chaining and nullish coalescing
          const data = result.data?.searchVehicleswithPagination;
          if (!data) {
            throw new Error('No vehicles data received');
          }
          return data;
        })
      );
  }

  updateVehicle(updatedVehicleInput: any): Observable<Vehicle> {
    return this.apollo
      .mutate<{ updateVehicle: Vehicle }>({
        mutation: UPDATE_VEHICLE,
        variables: { updatedVehicleInput }
      })
      .pipe(
        map(result => {
          const data = result.data?.updateVehicle;
          if (!data) {
            throw new Error('No updated vehicle data received');
          }
          return data;
        })
      );
  }

  deleteVehicle(id: string): Observable<Vehicle> {
    return this.apollo
      .mutate<{ deleteVehicle: Vehicle }>({
        mutation: DELETE_VEHICLE,
        variables: { id }
      })
      .pipe(
        map(result => {
          const data = result.data?.deleteVehicle;
          if (!data) {
            throw new Error('No deleted vehicle data received');
          }
          return data;
        })
      );
  }

   getServiceRecordByVin(vin: string): Observable<ServiceRecord[]> {
     return this.apollo
       .query<{ serviceRecordsByVin: ServiceRecord[] }>({
         query: GET_SERVICE_RECORDS_BY_VIN,
         variables: { vin },
         fetchPolicy: 'network-only'
       })
       .pipe(
         map(result => {
           const data = result.data?.serviceRecordsByVin ?? [];
           return data;
         })
       );
   }

   createServiceRecord(input: any): Observable<ServiceRecord> {
     return this.apollo
       .mutate<{ createServiceRecord: ServiceRecord }>({
         mutation: CREATE_SERVICE_RECORD,
         variables: { createServiceRecordInput: input }
       })
       .pipe(
         map(result => {
           const data = result.data?.createServiceRecord;
           if (!data) {
             throw new Error('Service record not created');
           }
           return data;
         })
       );
   }

   updateServiceRecord(input: any): Observable<ServiceRecord> {
     return this.apollo
       .mutate<{ updateServiceRecord: ServiceRecord }>({
         mutation: UPDATE_SERVICE_RECORD,
         variables: { updateServiceRecordInput: input }
       })
       .pipe(
         map(result => {
           const data = result.data?.updateServiceRecord;
           if (!data) {
             throw new Error('Service record not updated');
           }
           return data;
         })
       );
   }

   deleteServiceRecord(id: string): Observable<any> {
     return this.apollo
       .mutate<{ deleteServiceRecord: { id: string } }>({
         mutation: DELETE_SERVICE_RECORD,
         variables: { id }
       })
       .pipe(
         map(result => {
           const data = result.data?.deleteServiceRecord;
           if (!data) {
             throw new Error('Service record not deleted');
           }
           return data;
         })
       );
   }
}