import React, { Component } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Camera } from 'expo-camera'
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";

const TensorCamera = cameraWithTensors(Camera)

class LiveCamera extends Component {
  handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      console.log("Looped")
      const nextImageTensor = images.next().value;

      //
      // do something with tensor here
      //

      // if autorender is false you need the following two lines.
      // updatePreview();
      // gl.endFrameEXP();

      requestAnimation(loop);
    };
    loop();
  }

  componentDidMount() {
    console.log("Mounted")
  }

  render() {
    // Currently expo does not support automatically determining the
    // resolution of the camera texture used. So it must be determined
    // empirically for the supported devices and preview size.

    let textureDims;
    if (Platform.OS === "ios") {
      textureDims = {
        height: 1920,
        width: 1080,
      };
    } else {
      textureDims = {
        height: 1200,
        width: 1600,
      };
    }

    return (
      <View style={styles.container}>
        <TensorCamera
          // Standard Camera props
          style={styles.camera}
          type={Camera.Constants.Type.front}
          // Tensor related props
          cameraTextureHeight={textureDims.height}
          cameraTextureWidth={textureDims.width}
          resizeHeight={200}
          resizeWidth={152}
          resizeDepth={3}
          onReady={this.handleCameraStream}
          autorender={true}
        />
        <Text>here</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#333',
  }
})

export default LiveCamera;