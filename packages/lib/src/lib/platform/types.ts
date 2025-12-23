export interface Platform {
  storage: Storage;
  location: Location;
  history: History;
  addEventListener: (
    event: string,
    handler: (event: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    event: string,
    handler: (event: Event) => void,
    options?: boolean | EventListenerOptions,
  ) => void;
  scrollY: number;
  innerHeight: number;
}
