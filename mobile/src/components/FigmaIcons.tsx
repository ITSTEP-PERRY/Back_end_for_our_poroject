import { SvgXml } from "react-native-svg";
import { colors } from "../theme/colors";

function paint(xml: string, color: string) {
  return xml.replaceAll("#0E2042", color).replaceAll("black", color);
}

const MENU = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.66667 21H23.3333C23.975 21 24.5 20.475 24.5 19.8333C24.5 19.1917 23.975 18.6667 23.3333 18.6667H4.66667C4.025 18.6667 3.5 19.1917 3.5 19.8333C3.5 20.475 4.025 21 4.66667 21ZM4.66667 15.1667H23.3333C23.975 15.1667 24.5 14.6417 24.5 14C24.5 13.3583 23.975 12.8333 23.3333 12.8333H4.66667C4.025 12.8333 3.5 13.3583 3.5 14C3.5 14.6417 4.025 15.1667 4.66667 15.1667ZM3.5 8.16667C3.5 8.80833 4.025 9.33333 4.66667 9.33333H23.3333C23.975 9.33333 24.5 8.80833 24.5 8.16667C24.5 7.525 23.975 7 23.3333 7H4.66667C4.025 7 3.5 7.525 3.5 8.16667Z" fill="#0E2042"/></svg>`;

const SEARCH = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.65 16.65M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z" stroke="#0E2042" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CART = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 18C17.5304 18 18.0391 18.2107 18.4142 18.5858C18.7893 18.9609 19 19.4696 19 20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22C16.4696 22 15.9609 21.7893 15.5858 21.4142C15.2107 21.0391 15 20.5304 15 20C15 18.89 15.89 18 17 18ZM1 2H4.27L5.21 4H20C20.2652 4 20.5196 4.10536 20.7071 4.29289C20.8946 4.48043 21 4.73478 21 5C21 5.17 20.95 5.34 20.88 5.5L17.3 11.97C16.96 12.58 16.3 13 15.55 13H8.1L7.2 14.63L7.17 14.75C7.17 14.8163 7.19634 14.8799 7.24322 14.9268C7.29011 14.9737 7.3537 15 7.42 15H19V17H7C6.46957 17 5.96086 16.7893 5.58579 16.4142C5.21071 16.0391 5 15.5304 5 15C5 14.65 5.09 14.32 5.24 14.04L6.6 11.59L3 4H1V2ZM7 18C7.53043 18 8.03914 18.2107 8.41421 18.5858C8.78929 18.9609 9 19.4696 9 20C9 20.5304 8.78929 21.0391 8.41421 21.4142C8.03914 21.7893 7.53043 22 7 22C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20C5 18.89 5.89 18 7 18ZM16 11L18.78 6H6.14L8.5 11H16Z" fill="#0E2042"/></svg>`;

const STAR = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 11.5133L10.7667 13.1867C11.2733 13.4933 11.8933 13.04 11.76 12.4667L11.0267 9.32L13.4733 7.2C13.92 6.81333 13.68 6.08 13.0933 6.03333L9.87333 5.76L8.61333 2.78667C8.38667 2.24667 7.61333 2.24667 7.38667 2.78667L6.12667 5.75333L2.90667 6.02667C2.32 6.07333 2.08 6.80667 2.52667 7.19333L4.97333 9.31333L4.24 12.46C4.10667 13.0333 4.72667 13.4867 5.23333 13.18L8 11.5133Z" fill="#0E2042"/></svg>`;

const CHAT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5.2H11" stroke="#0E2042" stroke-width="1.5"/><path d="M4 8H11" stroke="#0E2042" stroke-width="1.5"/><path d="M4 10.8H11" stroke="#0E2042" stroke-width="1.5"/><path d="M14 8C14 6.14348 13.2625 4.36301 11.9497 3.05025C10.637 1.7375 8.85652 1 7 1C5.14348 1 3.36301 1.7375 2.05025 3.05025C0.737498 4.36301 0 6.14348 0 8C0 9.85652 0.737498 11.637 2.05025 12.9497C3.36301 14.2625 5.14348 15 7 15H14L12.2 13C13.35 11.85 14 10.35 14 8Z" stroke="#0E2042" stroke-width="1.5"/></svg>`;

type Props = { size?: number; color?: string };

export function IconMenu({ size = 28, color = colors.darkText }: Props) {
  return <SvgXml xml={paint(MENU, color)} width={size} height={size} />;
}
export function IconSearch({ size = 20, color = colors.darkText }: Props) {
  return <SvgXml xml={paint(SEARCH, color)} width={size} height={size} />;
}
export function IconCart({ size = 24, color = colors.darkText }: Props) {
  return <SvgXml xml={paint(CART, color)} width={size} height={size} />;
}
export function IconStar({ size = 16, color = colors.darkText }: Props) {
  return <SvgXml xml={paint(STAR, color)} width={size} height={size} />;
}
export function IconChat({ size = 16, color = colors.darkText }: Props) {
  return <SvgXml xml={paint(CHAT, color)} width={size} height={size} />;
}
