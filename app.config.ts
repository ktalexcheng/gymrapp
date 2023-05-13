import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "GymRapp",
    slug: "gymrapp",
    extra: {
        // ...config.extra,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    }
});
