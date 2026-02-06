import {
  AccommodationAttributes,
  DiningAttributes,
  EntertainmentAttributes,
  CultureAttributes,
} from "@/domain/attributes";

// Initialize JSONB with empty structure per category
export const initializePlaceAttributes = (category: string) => {
  switch (category) {
    case "Accommodation":
      return AccommodationAttributes.parse({});
    case "Dining":
      return DiningAttributes.parse({});
    case "Entertainment":
      return EntertainmentAttributes.parse({});
    case "Culture_and_Historicalsites":
      return CultureAttributes.parse({});
    default:
      return {};
  }
};
