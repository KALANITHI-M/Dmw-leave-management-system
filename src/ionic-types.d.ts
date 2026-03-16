import * as React from 'react';
import { IonApp as _IonApp, IonRouterOutlet as _IonRouterOutlet } from '@ionic/react';
import { IonReactRouter as _IonReactRouter } from '@ionic/react-router';

declare module '@ionic/react' {
  export const IonApp: React.FC<{ children?: React.ReactNode }>;
  export const IonRouterOutlet: React.FC<{ id?: string; style?: React.CSSProperties; children?: React.ReactNode }>;
}

declare module '@ionic/react-router' {
  export const IonReactRouter: React.FC<{ children?: React.ReactNode }>;
}
