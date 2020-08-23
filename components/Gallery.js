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

        <TouchableOpacity onPress={
          () => this.props.reset()
        }
        style={styles.resetButton}
        >
          <Text style={{
            color: '#FFF',
            fontSize: 18
          }}>
            Reset
          </Text>
          
        </TouchableOpacity>
      </View>

    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    alignItems: "center",
  },
  resetButton: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 12,
    backgroundColor: '#333567',
    borderRadius: 4,
  }
})