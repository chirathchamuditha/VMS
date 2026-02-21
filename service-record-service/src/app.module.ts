import { Module } from '@nestjs/common';
import { ServiceModule } from './service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig, ApolloFederationDriverConfig, ApolloFederationDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [ServiceModule,

    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
         path:join(process.cwd(), 'src/graphql-schema.gql'),
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
      database: 'serviceRec_service',
      entities: ["dist/**/*.entity{.ts,.js}"],
      synchronize: true,
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
