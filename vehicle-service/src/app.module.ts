import { Module } from '@nestjs/common';
import { VehicleModule } from './vehicle/vehicle.module';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver, ApolloDriverConfig, ApolloFederationDriverConfig, ApolloFederationDriver } from '@nestjs/apollo';
import { BatchModule } from './batch/batch.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [VehicleModule,
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        path: join(process.cwd(), 'src/graphql-schema.gql'),
        federation: 2
      },
      buildSchemaOptions: {
        directives: [], // disables schema-level @tag
      }
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'vehicle_service',
      entities: ["dist/**/*.entity{.ts,.js}"],
      synchronize: true,
    }),

    BatchModule,

    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),



  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
