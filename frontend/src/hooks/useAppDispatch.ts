import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '../store'

export const useAppDispatch = () => useDispatch()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector 