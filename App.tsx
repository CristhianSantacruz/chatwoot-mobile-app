import * as Sentry from '@sentry/react-native';
import App from './src/app';

// TODO: It is a temporary fix to fix the reanimated logger issue
// Ref: https://github.com/gorhom/react-native-bottom-sheet/issues/1983
// https://github.com/dohooo/react-native-reanimated-carousel/issues/706
import './reanimatedConfig';
// import './wdyr';

if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    attachScreenshot: true,
  });
}

if (__DEV__) {
  // eslint-disable-next-line
  require('./ReactotronConfig');
}

export default __DEV__ ? App : Sentry.wrap(App);