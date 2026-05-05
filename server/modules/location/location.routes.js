import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';

const router = Router();

router.use(authenticate);

// Reverse geocode (proxy to Mapbox)
router.post('/reverse-geocode', async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;
        const token = process.env.MAPBOX_ACCESS_TOKEN;

        if (!token) {
            return sendSuccess(res, { data: { district: 'unknown', formattedAddress: 'Location services unavailable' } });
        }

        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=district,place,locality`
        );
        const data = await response.json();

        const feature = data.features?.[0];
        const context = feature?.context || [];
        const district = context.find((c) => c.id?.startsWith('district'))?.text
            || context.find((c) => c.id?.startsWith('place'))?.text
            || feature?.text || 'unknown';
        const state = context.find((c) => c.id?.startsWith('region'))?.text || '';
        const country = context.find((c) => c.id?.startsWith('country'))?.text || '';

        sendSuccess(res, {
            data: {
                formattedAddress: feature?.place_name || '',
                district,
                state,
                country,
                town: feature?.text || '',
            },
        });
    } catch (error) { next(error); }
});

export default router;
