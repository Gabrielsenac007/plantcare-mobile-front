import { SvgXml } from "react-native-svg";
const xml =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 96" width="580" height="192" xmlns:c2pa="http://c2pa.org/manifest"><title>PlantCare</title><rect width="290" height="96" rx="16" fill="#27500A"/><g transform="translate(16 16)">\n<path d="M32 55V30" stroke="#DDEEC9" stroke-width="3" stroke-linecap="round" fill="none"/>\n<path d="M32 34C32 20 42 12 54 12C54 26 46 34 32 34Z" fill="#DDEEC9"/>\n<path d="M32 43C32 31 24 25 12 25C12 37 20 43 32 43Z" fill="#A7D676"/>\n<path d="M46 44C46 44 40 50.5 40 54.5A6 6 0 0 0 52 54.5C52 50.5 46 44 46 44Z" fill="#FFFFFF"/>\n</g><text x="92" y="59" font-family="Nunito, Poppins, \'Segoe UI\', system-ui, sans-serif" font-size="32" font-weight="700" letter-spacing="-0.5" fill="#FFFFFF">PlantCare</text></svg>\n';
export function Logo({ width = 218 }: { width?: number }) {
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={(width * 96) / 290}
      accessibilityLabel="PlantCare"
    />
  );
}
