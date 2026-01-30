import { createContext } from "react";
import { SampleContextType } from "../types/SampleContextTypes";

export const DEFAULT_SAMPLE_CONTEXT = {
  teamName: "Mississippi Farm to School Network",
  numTerms: 1,
  members: [
    "Erica",
    "Tony",
    "Kylie",
    "Lucas",
    "Michelle",
    "Daniel",
    "Fiona",
    "Jadiha",
    "Jane",
    "Lucas",
    "Patrick",
    "Tina",
    "Vidu",
    "Winston",
    "Sherry",
  ],
  isActive: true,
};

const SampleContext = createContext<SampleContextType>(DEFAULT_SAMPLE_CONTEXT);

export default SampleContext;
