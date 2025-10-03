import React from 'react';
import { Alert, Linking, Platform, Pressable, Text } from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/hooks';
import { updateAttachments } from '@/store/conversation/sendMessageSlice';
import type { AppDispatch } from '@/store';
import { useRefsContext } from '@/context';
import { AttachFileIcon, CameraIcon, MacrosIcon, PhotosIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation } from '@/utils';
import { Icon } from '@/components-next/common';
import { MAXIMUM_FILE_UPLOAD_SIZE } from '@/constants';
import i18n from '@/i18n';
import { showToast } from '@/utils/toastUtils';
import { findFileSize } from '@/utils/fileUtils';

export const handleOpenPhotosLibrary = async (dispatch: AppDispatch) => {
  const pickedAssets = await launchImageLibrary({
    quality: 1,
    selectionLimit: 4,
    mediaType: 'mixed',
    presentationStyle: 'formSheet',
  });
  if (pickedAssets.didCancel) {
  } else if (pickedAssets.errorCode) {
    Alert.alert(
      'Permission Denied',
      pickedAssets.errorMessage ||
        'The permission to access the photo library has been denied and cannot be requested again. Please enable it in your device settings if you wish to access photos from your library.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            // Open app settings
            Linking.openSettings();
          },
        },
      ],
      { cancelable: false },
    );
  } else {
    if (pickedAssets.assets && pickedAssets.assets?.length > 0) {
      validateFileAndSetAttachments(dispatch, pickedAssets.assets[0]);
    }
  }
};

const handleLaunchCamera = async (dispatch: AppDispatch) => {
  request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA).then(
    async result => {
      if (RESULTS.BLOCKED === result) {
        Alert.alert(
          'Permission Denied',
          'The permission to access the camera has been denied and cannot be requested again. Please enable it in your device settings if you wish to use the camera feature.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open app settings
                Linking.openSettings();
              },
            },
          ],
          { cancelable: false },
        );
      }
      if (RESULTS.GRANTED === result) {
        const imageResult = await launchCamera({
          presentationStyle: 'formSheet',
          mediaType: 'mixed',
        });
        if (imageResult.didCancel) {
        } else if (imageResult.errorCode) {
        } else {
          if (imageResult.assets && imageResult.assets?.length > 0) {
            validateFileAndSetAttachments(dispatch, imageResult.assets[0]);
          }
        }
      }
    },
  );
};

/**
 * Convierte el objeto del nuevo document picker al formato Asset de Image Picker
 * @param originalObject - El objeto retornado por el nuevo @react-native-documents/picker
 * @returns Array de Asset compatible con el formato existente
 */
const mapObject = (originalObject: any): Asset[] => {
  return [
    {
      fileName: originalObject.name || '',
      fileSize: originalObject.size || 0,
      type: originalObject.mimeType || originalObject.type || '',
      uri: originalObject.uri || '',
    },
  ];
};

const handleAttachFile = async (dispatch: AppDispatch) => {
  try {
    // Usar la nueva API pick() en lugar de DocumentPicker.pick()
    const result = await pick({
      type: [
        types.allFiles,
        types.images,
        types.plainText,
        types.audio,
        types.pdf,
        types.zip,
        types.csv,
        types.doc,
        types.docx,
        types.ppt,
        types.pptx,
        types.xls,
        types.xlsx,
      ],
      presentationStyle: 'formSheet',
      allowMultiSelection: false, // Nueva API
    });
    
    // result ya es un array, no necesitas result[0]
    if (result && result.length > 0) {
      const file = mapObject(result[0])[0];
      validateFileAndSetAttachments(dispatch, file);
    }
  } catch (err: any) {
    // El nuevo paquete usa un error estándar cancelado
    if (err?.message?.includes('cancel') || err?.userCancelled) {
      // Usuario canceló el picker
    } else {
      console.error('Document picker error:', err);
    }
  }
};

const ADD_MENU_OPTIONS = [
  {
    icon: <PhotosIcon />,
    title: 'Photos',
    handlePress: handleOpenPhotosLibrary,
  },
  {
    icon: <CameraIcon />,
    title: 'Camera',
    handlePress: handleLaunchCamera,
  },
  {
    icon: <AttachFileIcon />,
    title: 'Attach File',
    handlePress: handleAttachFile,
  },
  {
    icon: <MacrosIcon />,
    title: 'Macros',
    handlePress: () => {},
  },
];

// ... existing code ...
export const validateFileAndSetAttachments = async (dispatch: AppDispatch, attachment: Asset) => {
  const { fileSize } = attachment;
  if (typeof fileSize === 'number' && findFileSize(fileSize) <= MAXIMUM_FILE_UPLOAD_SIZE) {
    dispatch(updateAttachments([attachment]));
  } else if (typeof fileSize !== 'number') {
    showToast({ message: i18n.t('CONVERSATION.FILE_SIZE_LIMIT') });
  } else {
    showToast({ message: i18n.t('CONVERSATION.FILE_SIZE_LIMIT') });
  }
};
// ... existing code ...

type MenuOptionProps = {
  index: number;
  menuOption: (typeof ADD_MENU_OPTIONS)[0];
};

const MenuOption = (props: MenuOptionProps) => {
  const { index, menuOption } = props;
  const dispatch = useAppDispatch();
  const { macrosListSheetRef } = useRefsContext();

  const { animatedStyle, handlers } = useScaleAnimation();
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    menuOption?.handlePress(dispatch);
    if (menuOption.title === 'Macros') {
      macrosListSheetRef.current?.present();
    }
  };

  return (
    <Animated.View style={[tailwind.style('mb-3'), animatedStyle]}>
      <Pressable onPress={handlePress} {...handlers}>
        <Animated.View key={index} style={[tailwind.style('flex-row items-center justify-start')]}>
          <Animated.View style={tailwind.style('p-2')}>
            <Icon icon={menuOption.icon} size={24} />
          </Animated.View>
          <Text
            style={tailwind.style(
              'text-base font-inter-normal-20 leading-[18px] tracking-[0.24px] text-gray-950 pl-5',
            )}>
            {menuOption.title}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const CommandOptionsMenu = () => {
  const { bottom } = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const containerHeight = isAndroid
    ? 210 + (bottom === 0 ? 16 : bottom)
    : 175 + (bottom === 0 ? 16 : bottom);
  return (
    <Animated.View
      entering={SlideInDown.springify().damping(38).stiffness(240)}
      exiting={SlideOutDown.springify().damping(38).stiffness(240)}
      style={tailwind.style('mx-1 pt-2 items-start', `h-[${containerHeight}px]`)}>
      {ADD_MENU_OPTIONS.map((menuOption, index) => {
        return <MenuOption key={menuOption.title} {...{ menuOption, index }} />;
      })}
    </Animated.View>
  );
};