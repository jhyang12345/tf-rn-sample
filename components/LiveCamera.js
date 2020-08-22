import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from "expo-image-manipulator";
import * as Permissions from 'expo-permissions';
import * as tf from '@tensorflow/tfjs'
import { fetch } from '@tensorflow/tfjs-react-native'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as jpeg from 'jpeg-js'
import { FontAwesome, Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


export default class App extends React.Component {
  state = {
    isTfReady: false,
    isModelReady: false,
    hasPermission: null,
    cameraType: Camera.Constants.Type.front,
    pictureTaken: false,
    picture: null,
    faces: [],
    dimensions: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
  }

  async componentDidMount() {
    await tf.ready()
    this.setState({
      isTfReady: true
    })
    this.model = await mobilenet.load()
    this.setState({ isModelReady: true })
    console.log("Model ready")
    this.getPermissionAsync()
  }

  getPermissionAsync = async () => {
    // Camera roll Permission 
    if (Platform.OS === 'ios') {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
    // Camera Permission
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasPermission: status === 'granted' });
  }

  handleCameraType=()=>{
    const { cameraType } = this.state

    this.setState({cameraType:
      cameraType === Camera.Constants.Type.back
      ? Camera.Constants.Type.front
      : Camera.Constants.Type.back
    })
  }

  imageToTensor(rawImageData) {
    const TO_UINT8ARRAY = true
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY)
    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array(width * height * 3)
    let offset = 0 // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset]
      buffer[i + 1] = data[offset + 1]
      buffer[i + 2] = data[offset + 2]

      offset += 4
    }

    return tf.tensor3d(buffer, [height, width, 3])
  }

  classifyImage = async (image) => {
    try {
      const imageAssetPath = await Image.resolveAssetSource(image)
      console.log('here', imageAssetPath)
      const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
      console.log(response)
      const rawImageData = await response.arrayBuffer()
      const imageTensor = this.imageToTensor(rawImageData)
      const predictions = await this.model.classify(imageTensor)
      this.setState({ predictions })
      console.log(predictions)
    } catch (error) {
      console.log(error)
    }
  }

  getCropDimensions = (crop, photo) => {
    const { dimensions } = this.state
    const widthRatio = photo.width / dimensions.width
    const heightRatio = photo.height / dimensions.height
    return {
      originX: crop.originX * widthRatio,
      originY: crop.originY * heightRatio,
      width: crop.width * widthRatio,
      height: crop.height * heightRatio
    }
  }

  takePicture = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync({
        exif: true,
        quality: 0.5
      })

      const { faces } = this.state

      if (faces.length > 0) {
        faces.forEach(async (face) => {
          const cropDimensions = this.getCropDimensions({
            originX: face.bounds.origin.x,
            originY: face.bounds.origin.y,
            width: face.bounds.size.width,
            height: face.bounds.size.height
          }, photo)
          const newUri = await ImageManipulator.manipulateAsync(photo.uri, [
            {
              crop: cropDimensions
            },
            {
              flip: 'horizontal'
            }
          ])

          this.setState({
            pictureTaken: true,
            picture: newUri,
          })
        })
      }

      // this.setState({
      //   pictureTaken: true,
      //   picture: {uri: photo.uri},
      // })
      // console.log(photo)

      
      // const newUri = await ImageManipulator.manipulateAsync(photo.uri, [
      //   {
      //     crop: {
            
      //     }
      //   },
      //   {
      //     resize: {
      //       width: 420,
      //     }
      //   }
      // ])

      // console.log(newUri)

      // this.classifyImage({
      //   uri: newUri.uri,
      // })
    }
  }

  pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
  }

  onFacesDetected = ({faces}) => {
    this.setState({
      faces: faces,
    })
  }

  drawFaces() {
    const { faces } = this.state

    return (
    <React.Fragment>
      {    
        faces.map((face) => {
          return (
          <View
            key={face.bounds.origin.x}
            style={{
            width: face.bounds.size.width,
            height: face.bounds.size.height,
            position: 'absolute',
            left: face.bounds.origin.x,
            top: face.bounds.origin.y,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: '#FFF',
          }}>
          </View>
        )}
        )
      }
    </React.Fragment>
    )
  }

  render(){
    const { hasPermission, pictureTaken, picture } = this.state
    if (hasPermission === null) {
      return <View />;
    } else if (hasPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
          <View style={{ flex: 1 }}>
          {
            pictureTaken === false
            ?
            <Camera
              style={{ flex: 1 }}
              type={this.state.cameraType}
              ref={ref => {this.camera = ref}}
              onFacesDetected={this.onFacesDetected}
              onLayout={(evt) => {
                const {x, y, width, height} = evt.nativeEvent.layout
                this.setState({
                  dimensions: {
                    x,
                    y,
                    width,
                    height
                  }
                })
              }}
            >
              <View style={{flex:1, flexDirection:"row",justifyContent:"space-between",margin:30}}>
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-end',
                    alignItems: 'center',
                    backgroundColor: 'transparent'                 
                  }}
                  onPress={()=>this.pickImage()}>
                  <Ionicons
                      name="ios-photos"
                      style={{ color: "#fff", fontSize: 40}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-end',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                  }}
                  onPress={()=>this.takePicture()}
                  >
                  <FontAwesome
                      name="camera"
                      style={{ color: "#fff", fontSize: 40}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-end',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                  }}
                  onPress={()=>this.handleCameraType()}
                  >
                  <MaterialCommunityIcons
                      name="camera-switch"
                      style={{ color: "#fff", fontSize: 40}}
                  />
                </TouchableOpacity>
                
              </View>
              {this.drawFaces()}
            </Camera>
            : <Image
                resizeMethod={'scale'}
                resizeMode={'contain'}
                style={{
                  width: 300,
                  height: 300,
                  resizeMode: 'contain',
                }}
                source={picture}
              />
          }
            
        </View>
      );
    }
  }
  
}