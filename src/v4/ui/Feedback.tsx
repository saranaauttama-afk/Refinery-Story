import { POLISH } from '../data/balance'
import React,{createContext,useContext,useEffect,useRef,useState} from 'react'
import {AccessibilityInfo,View,Animated,useWindowDimensions} from 'react-native'
import {useAudioPlayer} from 'expo-audio'
import * as Haptics from 'expo-haptics'
import {useGame} from '../store/useGame'
const Feedback=createContext<(success?:boolean)=>void>(()=>{})
export const useFeedback=()=>useContext(Feedback)
export function FeedbackProvider({children}:{children:React.ReactNode}){
 const {state:s}=useGame(),click=useAudioPlayer(require('../../../assets/v4/click.wav')),chime=useAudioPlayer(require('../../../assets/v4/chime.wav'))
 const confetti=useRef(new Animated.Value(0)).current;const {height}=useWindowDimensions()
 const [burst,setBurst]=useState(false),[reduced,setReduced]=useState(false);const previousRank=useRef(s.rank),seen=useRef(new Set<string>()),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 useEffect(()=>{AccessibilityInfo.isReduceMotionEnabled().then(setReduced);const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{sub.remove();if(timer.current)clearTimeout(timer.current)}},[])
 function play(success=false){if(s.settings.sound){const player=success?chime:click;player.seekTo(0).then(()=>player.play()).catch(()=>{})}if(s.settings.haptics){if(success)Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});else Haptics.selectionAsync().catch(()=>{})}if(success&&!reduced){setBurst(true);if(timer.current)clearTimeout(timer.current);confetti.setValue(0);Animated.timing(confetti,{toValue:1,duration:POLISH.confettiMs,useNativeDriver:true}).start(()=>setBurst(false))}}
 useEffect(()=>{if(s.tick===0)seen.current.clear();const newGrade=s.popups.some(p=>!seen.current.has(p.uid)&&['S!','SS!'].includes(p.en));for(const p of s.popups)seen.current.add(p.uid);if(s.rank>previousRank.current||newGrade)play(true);previousRank.current=s.rank;if(seen.current.size>100)seen.current=new Set(s.popups.map(p=>p.uid))},[s.rank,s.popups])
 return <Feedback.Provider value={play}>{children}{burst&&<Animated.View pointerEvents="none" style={{position:'absolute',inset:0,overflow:'hidden',opacity:confetti.interpolate({inputRange:[0,.7,1],outputRange:[1,1,0]}),transform:[{translateY:confetti.interpolate({inputRange:[0,1],outputRange:[-height*.5,height*.5]})}]}}>{Array.from({length:POLISH.confettiPieces},(_,i)=><View key={i} style={{position:'absolute',left:`${(i*37)%100}%`,top:`${(i*13)%80}%`,width:6,height:10,backgroundColor:['#E2483D','#F2C230','#3D8FE0','#2FB38E'][i%4],transform:[{rotate:`${i*23}deg`}]}}/>)}</Animated.View>}</Feedback.Provider>
}
