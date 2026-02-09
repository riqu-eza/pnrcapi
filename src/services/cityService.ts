// /services/cityService.ts
import {prisma} from '../lib/prisma';

export const createCity = async (data: {
  name: string;
  slug: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  coverImage?: string;
  description?: string;
}) => {
  return prisma.city.create({ data });
};

export const getCityById = async (id: string) => {
  return prisma.city.findUnique({
    where: { id },
    include: { places: true, events: true, blogPosts: true },
  });
};

export const getCityBySlug = async (slug: string) => {
  return prisma.city.findUnique({
    where: { slug },
    include: { places: true, events: true, blogPosts: true },
  });
};

export const listCities = async (filters?: { country?: string; region?: string; isActive?: boolean }) => {
  return prisma.city.findMany({
    where: { ...filters },
    orderBy: { name: 'asc' },
  });
};

export const updateCity = async (id: string, data: Partial<{
  name: string;
  slug: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  coverImage: string;
  description: string;
  isActive: boolean;
}>) => {
  return prisma.city.update({ where: { id }, data });
};

export const deleteCity = async (id: string) => {
  return prisma.city.delete({ where: { id } });
};
