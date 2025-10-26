import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

export default function Index() {
  const [currentTime, setCurrentTime] = useState<string | undefined>(undefined)

  function getHelloWorld(): string {
    'use ai'
    throw new Error('Not implemented')
  }

  function getCurrentTime(): string {
    'use ai'
    // instructions=This function should return a human-readable string which includes hours/mins/seconds to be displayed inside a clock.
    throw new Error('Not implemented')
  }

  useEffect(() => {
    setCurrentTime(getCurrentTime())
    setInterval(() => setCurrentTime(getCurrentTime()), 1000)
  }, [])


  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{fontSize: 22, textTransform:"uppercase"}}>{getHelloWorld()}</Text>
      {!!currentTime && <Text>{currentTime}</Text>}
    </View>
  )
}
