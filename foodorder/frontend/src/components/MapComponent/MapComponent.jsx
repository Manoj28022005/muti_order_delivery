// import { useEffect, useRef, useState } from "react";

// const containerStyle = {
//   width: "100%",
//   height: "400px",
// };

// const MapComponent = ({ coordinates }) => {
//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const [center, setCenter] = useState({
//     lat: 20.95007937441471, // Default latitude
//     lng: 79.02641771114747, // Default longitude
//   });

//   useEffect(() => {
//     const loadScript = (url, callback) => {
//       const script = document.createElement("script");
//       script.src = url;
//       script.async = true;
//       script.defer = true;
//       script.onload = callback;
//       document.body.appendChild(script);
//     };

//     loadScript(
//       "https://maps.gomaps.pro/maps/api/js?key=YOUR_GOMAPS_API_KEY&callback=initMap",
//       () => {
//         if (window.google && window.google.maps) {
//           const map = new window.google.maps.Map(mapRef.current, {
//             center,
//             zoom: 12,
//           });

//           const marker = new window.google.maps.Marker({
//             position: center,
//             map,
//           });

//           markerRef.current = marker;
//         }
//       }
//     );
//   }, []);

//   useEffect(() => {
//     if (coordinates.lat && coordinates.lng) {
//       setCenter(coordinates);
//       if (mapRef.current && markerRef.current) {
//         markerRef.current.setPosition(coordinates);
//         mapRef.current.setCenter(coordinates);
//       }
//     }
//   }, [coordinates]);

//   return <div ref={mapRef} style={containerStyle}></div>;
// };

// export default MapComponent;
import React from 'react'

function MapComponent() {
  return (
    <div>
      
    </div>
  )
}

export default MapComponent
