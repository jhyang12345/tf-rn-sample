import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image } from 'react-native';


export default class Gallery extends React.Component {
  render() {
    const { pictures } = this.props

    return (
      <View style={styles.container}>
        {
          pictures.map((picture) => (
            <Image
              resizeMethod={'scale'}
              resizeMode={'contain'}
              key={picture.uri}
              style={{
                width: 275,
                height: 275,
                resizeMode: 'contain',
              }}
              source={picture}
            />
          ))
        }
      </View>

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    alignItems: "center",
  }
})