import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";

import Camera from './components/Camera'

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isTfReady: false,
    };
  }
 
  async componentDidMount() {
    // Wait for tf to be ready.
    console.log("Starting")
    await tf.ready();

    console.log("Waited...")
    // Signal to the app that tensorflow.js can now be used.
    this.setState({
      isTfReady: true,
    });
  }

  render() {

    const { isTfReady } = this.state

    return (
      <View style={styles.container}>
        <Camera />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#787712'
  },
});
