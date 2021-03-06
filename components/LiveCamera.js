import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from "expo-image-manipulator";
import * as Permissions from 'expo-permissions';
import * as tf from '@tensorflow/tfjs'
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as jpeg from 'jpeg-js'
import { FontAwesome, Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


import Gallery from './Gallery'

export default class LiveCamera extends React.Component {
  state = {
    isTfReady: false,
    isModelReady: false,
    hasPermission: null,
    cameraType: Camera.Constants.Type.front,
    pictureTaken: false,
    pictures: [],
    predictions: [],
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
    try {
      const modelJson = require('../models/cnn_dropout/model.json')
      const modelWeightsId = require('../models/cnn_dropout/group1-shard1of1.bin')
      const resource = await bundleResourceIO(modelJson, modelWeightsId)
      // Provided weight data has no target variable: batch_normalization_40/moving_mean
      // this.model = await tf.loadLayersModel(resource, { strict: false })
      this.model = await tf.loadLayersModel(resource)
    } catch (err) {
      console.log(err)
    }
    
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

    const tensor = tf.tensor4d(buffer, [1, height, width, 3])

    const half = 255 / 2
    let normalizedInputs = tensor.sub(half).div(half)

    console.log(normalizedInputs.max().dataSync(), normalizedInputs.min().dataSync())

    return normalizedInputs
  }

  classifyImage = async (image) => {
    try {
      console.log("Classifying image...")
      const imageAssetPath = await Image.resolveAssetSource(image)
      const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
      const rawImageData = await response.arrayBuffer()
      const imageTensor = this.imageToTensor(rawImageData)
      console.log(imageTensor.shape)
      const prediction = await this.model.predict(imageTensor)
      const value = prediction.dataSync()
      return value[0]
    } catch (error) {
      console.log(error)
    }
  }

  getCropDimensions = (crop, photo) => {
    const { dimensions } = this.state
    const widthRatio = photo.width / dimensions.width
    const heightRatio = photo.height / dimensions.height
    console.log(crop, dimensions, widthRatio, heightRatio)
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

      const { faces, cameraType } = this.state

      if (faces.length > 0) {
        for (const face of faces) {
          const cropDimensions = this.getCropDimensions({
            originX: face.bounds.origin.x,
            originY: face.bounds.origin.y,
            width: face.bounds.size.width,
            height: face.bounds.size.height
          }, photo)

          let newUri;
          if (cameraType === Camera.Constants.Type.front) {
            newUri = await ImageManipulator.manipulateAsync(photo.uri, [
              {
                crop: cropDimensions
              },
              {
                flip: 'horizontal'
              }
            ])
          } else {
            newUri = await ImageManipulator.manipulateAsync(photo.uri, [
              {
                crop: cropDimensions
              }
            ])
          } 

          this.setState((prevState) => ({
            pictures: [...prevState.pictures, newUri],
          }))
        }

        const { pictures } = this.state
        for (const picture of pictures) {
          const resizedImage = await ImageManipulator.manipulateAsync(picture.uri, [
            {
              resize: {
                width: 128,
                height: 128,
              }
            }
          ])
          const prediction = await this.classifyImage(resizedImage)
          console.log("Done predicting")

          this.setState((prevState) => ({
            pictureTaken: true,
            predictions: [...prevState.predictions, prediction],
          }))
        }
      }

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

  reset = () => {
    this.setState({
      pictureTaken: false,
      pictures: [],
      predictions: [],
    })
  }

  render(){
    const { hasPermission, pictureTaken, pictures, predictions, isModelReady } = this.state
    if (isModelReady === false) {
      return (
        <View style={{
          marginTop: 64,
          padding: 4,
        }}>
          <Text style={{color: '#FFF', fontSize: 32, fontWeight: 'bold', textAlign: 'center'}}>
            Loading Model...
          </Text>
        </View>
      )
    }
    else if (hasPermission === false) {
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
            : <ScrollView>
                <Gallery 
                  pictures={pictures}
                  predictions={predictions}
                  reset={this.reset}
                />
            </ScrollView>

          }
          {
            this.state.bufferImage
            ? <Image source={this.state.bufferImage} />
            : null
          }
            
        </View>
      );
    }
  }
  
}