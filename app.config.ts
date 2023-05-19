import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: "GymRapp",
        slug: "gymrapp",
        android: {
            ...config.android,
            googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
        },
        extra: {
            ...config.extra,
            googleClientId: process.env.GOOGLE_CLIENT_ID,
        }
    }
};
