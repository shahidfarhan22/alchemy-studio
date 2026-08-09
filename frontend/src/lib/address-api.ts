import { apiFetch } from "./api-client";

// Mirrors backend/src/AlchemyStudio.Api/Addresses/AddressDtos.cs.
export type AddressDto = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type AddressInput = Omit<AddressDto, "id" | "country">;

export const getAddresses = () => apiFetch<AddressDto[]>("/api/v1/addresses");
export const createAddress = (input: AddressInput) =>
  apiFetch<AddressDto>("/api/v1/addresses", { method: "POST", body: input });
export const updateAddress = (id: string, input: AddressInput) =>
  apiFetch<AddressDto>(`/api/v1/addresses/${id}`, { method: "PUT", body: input });
export const deleteAddress = (id: string) =>
  apiFetch<void>(`/api/v1/addresses/${id}`, { method: "DELETE" });
