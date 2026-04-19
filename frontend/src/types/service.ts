export interface ServicePackage {
  _id?: string;
  id?: string;
  name: string;
  desc: string;
  price: number;
}

export interface ServiceRecord {
  _id?: string;
  id?: string;
  slug: string;
  title: string;
  desc: string;
  details: string;
  packages: ServicePackage[];
  image?: string;
  isActive?: boolean;
}

export function normalizeServicePackage(pkg: ServicePackage): ServicePackage {
  return {
    ...pkg,
    id: pkg.id ?? pkg._id ?? pkg.name.toLowerCase().replace(/\s+/g, "-"),
  };
}

export function normalizeService(service: ServiceRecord): ServiceRecord {
  return {
    ...service,
    id: service.id ?? service._id,
    packages: service.packages.map(normalizeServicePackage),
  };
}
