export type PlaylistData = {
    title: string
    description: string
    lastPlayed: number
    shuffledSequence: number[]
    chains: number[][]
}
  
export type CombinedData = {
    sources: string[]
}
  
export type UserData = {
    playlists: {
        [playlistId: string]: PlaylistData
    }
    combined: {
        [combinedTitle: string]: CombinedData
    }
}
  
// 🔑 전체 DB 구조: userId를 key로 하는 객체
type FullDB = {
    [userId: string]: UserData
}
  
const STORAGE_KEY = 'ytsh_db'
  
/** DB 전체 불러오기 */
export function loadDB(): FullDB {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
}
  
/** DB 전체 저장 */
export function saveDB(db: FullDB) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}
  
/** 특정 사용자 데이터 불러오기 */
function getUserData(userId: string): UserData
function getUserData(userId: string, db: FullDB): UserData

function getUserData(userId: string, db? : FullDB): UserData {
    return (db?? loadDB())[userId] ?? { playlists: {}, combined: {} }
}

  
/** 특정 사용자 데이터 저장 */
export function updateUserData(userId: string, newData: Partial<UserData>) {
    const db = loadDB()
    const prev = getUserData(userId, db)
    db[userId] = {
        playlists: { ...prev.playlists, ...newData.playlists },
        combined: { ...prev.combined, ...newData.combined },
    }
    console.log("Data Saved! User: ", userId)
    saveDB(db)
}
  
/** 재생목록 메타데이터 저장 */
export function savePlaylistMeta(
    userId: string,
    playlistId: string,
    title: string,
    description: string
) {
    if(playlistId == "") return
    const user = getUserData(userId)
    user.playlists[playlistId] ??= {
        title,
        description,
        lastPlayed: 0,
        shuffledSequence: [],
        chains: [],
    }
    updateUserData(userId, { playlists: { [playlistId]: user.playlists[playlistId] } })
}
  
/** 셔플 순서 저장 */
export function saveShuffledSequence(userId: string, playlistId: string, sequence: number[]) {
    const user = getUserData(userId)
    if (!user.playlists[playlistId] || playlistId == "") return
    user.playlists[playlistId].shuffledSequence = sequence
    updateUserData(userId, { playlists: { [playlistId]: user.playlists[playlistId] } })
}
  
/** 마지막 재생 인덱스 저장 */
export function saveLastPlayedIndex(userId: string, playlistId: string, index: number) {
    const user = getUserData(userId)
    if (!user.playlists[playlistId] || playlistId == "") return
    user.playlists[playlistId].lastPlayed = index
    updateUserData(userId, { playlists: { [playlistId]: user.playlists[playlistId] } })
}
  
/** chains 규칙 저장 */
export function saveChains(userId: string, playlistId: string, chains: number[][]) {
    const user = getUserData(userId)
    if (!user.playlists[playlistId] || playlistId == "") return
    user.playlists[playlistId].chains = chains
    updateUserData(userId, { playlists: { [playlistId]: user.playlists[playlistId] } })
}
  
/** 단일 재생목록 데이터 조회 */
export function getPlaylistData(userId: string, playlistId: string): PlaylistData | null {
    const user = getUserData(userId)
    return user.playlists[playlistId] ?? null
}

/** 모든 재생목록 데이터 조회 */
export function getAllPlaylists(userId: string) {
    const user = getUserData(userId)
    return user.playlists
}

export function deletePlaylistData(userId: string, playlistId: string) {
    const db = loadDB()
    if (!db[userId]?.playlists?.[playlistId]) return

    delete db[userId].playlists[playlistId]
    saveDB(db)
}