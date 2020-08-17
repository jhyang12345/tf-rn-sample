import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import { FontAwesome, Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';




export default class App extends React.Component {
  state = {
    hasPermission: null,
    cameraType: Camera.Constants.Type.front,
    pictureTaken: false,
    picture: null,
    faces: []
  }

  async componentDidMount() {
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

  takePicture = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync({
        exif: true
      });
      this.setState({
        pictureTaken: true,
        picture: photo,
      })
      console.log(photo)
    }
  }

  pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
  }

  onFacesDetected = (faces) => {
    this.setState({
      faces: faces.faces,
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
            borderRadius: 3,
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
                {this.drawFaces()}
              </View>

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