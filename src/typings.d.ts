// leaflet-routing-machine declaration
declare module 'leaflet-routing-machine' {
  const content: any;
  export default content;
}

// Extend Leaflet namespace so L.Routing exists
import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}
