import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { IntrospectAndCompose } from '@apollo/gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        gateway: {
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
              {
                name: 'vehicle-service',
                url: configService.get('VEHICLE_SERVICE_URL', 'http://localhost:3000/graphql'),
              },

              {
                name: 'serviceRecord-service',
                url: configService.get('SERVICERECORD_SERVICE_URL', 'http://localhost:3001/graphql'),
              }
            ]
          })
        },

        server: {
          playground: true,
          introspection: true,
          cors: {
            origin: configService.get('FRONTEND_URL', 'http://localhost:4200'),
            credentials: true,
          }
        }
      })

    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
