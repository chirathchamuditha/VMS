import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { NgxSonnerToaster } from 'ngx-sonner';

export const appConfig: ApplicationConfig = {
  providers: [
      provideRouter(routes),
      provideHttpClient(),
      NgxSonnerToaster,

      provideApollo(() => {
        const httpClient = inject(HttpClient);

        const httplink = new HttpLink(httpClient)

        return {
          link: httplink.create({
            uri: 'http://localhost:4000/graphql'
          }),
          cache: new InMemoryCache()
        }
      })


    ]
};
