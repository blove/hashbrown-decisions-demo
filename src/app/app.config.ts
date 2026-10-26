import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHashbrown } from '@hashbrownai/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The chat streams from /api/chat. Each decision passes its own transport
    // for /api/decide/<kind>, so the server can pin that decision's questions.
    provideHashbrown({ baseUrl: '/api/chat' }),
  ],
};
