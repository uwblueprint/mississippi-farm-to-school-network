import FarmService from '@/services/implementations/farmService';
import IFarmService from '@/services/interfaces/farmService';

const farmService: IFarmService = new FarmService();

const farmResolvers = {
  Query: {
    farmsByProximity: async (
      _: unknown,
      { lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }
    ) => {
      if (lat < -90 || lat > 90) throw new Error('lat must be between -90 and 90');
      if (lng < -180 || lng > 180) throw new Error('lng must be between -180 and 180');
      if (radiusKm <= 0) throw new Error('radiusKm must be positive');
      return farmService.getFarmsByProximity(lat, lng, radiusKm);
    },
  },
};

export default farmResolvers;
