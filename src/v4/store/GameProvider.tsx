import type { LocalizedText } from '../i18n'
import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
import {AppState} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {B,MONTH} from '../data/balance'
import {createNewGame} from '../sim/state'
import {tick} from '../sim/tick'
import {serialize,deserialize} from '../sim/save'
import type {Action,GameState} from '../sim/types'
interface GameContext {state:GameState;ready:boolean;hasSave:boolean;saveError:LocalizedText|null;dispatch:(action:Action)=>void;newGame:()=>void;setPlaying:(active:boolean)=>void;retrySave:()=>void}
const Context=createContext<GameContext|null>(null)
export function GameProvider({children}:{children:React.ReactNode}){
 const [state,setState]=useState(createNewGame),[ready,setReady]=useState(false),[hasSave,setHasSave]=useState(false),[saveError,setSaveError]=useState<LocalizedText|null>(null),[active,setActive]=useState(AppState.currentState==='active'),[playing,setPlaying]=useState(false)
 const latest=useRef(state),started=useRef(false),writes=useRef(Promise.resolve());latest.current=state
 const persist=useCallback((s:GameState)=>{const raw=serialize(s);writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(B.saveKey,raw)).then(()=>{setHasSave(true);setSaveError(null)}).catch(()=>setSaveError({en:'Save failed. Please retry.',th:'บันทึกเกมไม่สำเร็จ โปรดลองอีกครั้ง'}))},[])
 useEffect(()=>{let mounted=true;AsyncStorage.getItem(B.saveKey).then(raw=>{if(raw&&mounted){setState(deserialize(raw));started.current=true;setHasSave(true)}}).catch(()=>{if(mounted)setSaveError({en:'Save unavailable or incompatible. You can start a new game.',th:'อ่านเซฟไม่ได้หรือเซฟไม่ตรงกับรุ่นนี้ สามารถเริ่มเกมใหม่ได้'})}).finally(()=>{if(mounted)setReady(true)})
  const sub=AppState.addEventListener('change',status=>{setActive(status==='active');if(status!=='active'&&started.current)persist(latest.current)});return()=>{mounted=false;sub.remove()}
 },[persist])
 useEffect(()=>{if(!ready||!active||!playing||state.speed===0)return;const timer=setInterval(()=>setState(tick),B.tickMs/state.speed);return()=>clearInterval(timer)},[ready,active,playing,state.speed])
 useEffect(()=>{if(ready&&state.tick>0&&state.tick%MONTH===0)persist(latest.current)},[state.tick,ready,persist])
 const dispatch=useCallback((action:Action)=>setState(action),[])
 const newGame=()=>{const s=createNewGame();started.current=true;setState(s);persist(s)}
 return <Context.Provider value={{state,ready,hasSave,saveError,dispatch,newGame,setPlaying,retrySave:()=>persist(latest.current)}}>{children}</Context.Provider>
}
export function useGame(){const value=useContext(Context);if(!value)throw new Error('Missing GameProvider');return value}
