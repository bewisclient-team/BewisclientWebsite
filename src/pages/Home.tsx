import { ReactNode, useEffect, useRef, useState } from "react"
import "../modrinth/modrinth"
import { newest_versions } from "../modrinth/modrinth"

let setAllBackgroundColor = (_:number)=>{}

export const versionSetter = {
    beta: (_: any)=>{},
    release: (_: any)=>{}
};

export function Home() {
    const [allBackgroundColor, setAllBGC] = useState(document.scrollingElement?.scrollTop!/(document.scrollingElement?.scrollHeight!-document.scrollingElement?.clientHeight!)*-0.5+1)

    setAllBackgroundColor = setAllBGC

    document.getElementById('root')!.style.backgroundColor = "white"//`rgb(${allBackgroundColor*12},${allBackgroundColor*61},${allBackgroundColor*61})`

    return <><UpArrow></UpArrow><div className="home_list">
        <Headline/>
        <hr></hr>
        <div className="version_list">
            <HomeVersionListElement type="release"/>
            <HomeVersionListElement type="beta"/>
        </div>
        <hr></hr>
        <ListTextWithImage index={0} headline="Widgets" subtext={"Bewisclient provides a ton of usefull on-screen widgets"} image={"widgets.png"}></ListTextWithImage>
        <hr></hr>
        <ListTextWithImage index={1} headline="Zoom" subtext={"Bewisclient allows you to zoom in-game"} image={"zoom.gif"} right></ListTextWithImage>
        <hr></hr>
        <br/>
        <div style={{display: "flex", justifyContent: "center"}}>
            <IconImage url="https://github.com/Bewis09/Bewisclient-2" icon="github"/>
            <IconImage url="https://modrinth.com/mod/bewisclient/versions" icon="modrinth"/>
            <IconImage url="https://www.youtube.com/channel/UCtegj2E28HnCTqPm9kIXmdg" icon="youtube"/>
        </div>
        <br/>
        <hr></hr>
        <ListTextWithImage index={2} headline="Pumpkin Overlay" subtext={"Bewisclient allows you to disable the pumpkin overlay"} image={"pumpkin.gif"}></ListTextWithImage>
    </div></>
}

function isNotBelowView(y: number) {
    return y<innerHeight
}

export function ListTextWithImage(props: { headline: string, subtext: string, image: string, right?: boolean, index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    
    const [visible, setVisible] = useState(false)

    useEffect(()=>{
        if(ref.current) {
            setVisible(isNotBelowView(ref.current.getBoundingClientRect().y))
        }
    })
    
    return <><div ref={ref} className={"list_text_with_image " + (visible?"-visible":"-invisible")}>
            {
                (() => {
                    let a: ReactNode[] = []
                    a.push(<div key={0} className="list_text_text">
                        {props.headline}
                        <div className="list_text_text_subtext">
                            {props.subtext}
                        </div>
                    </div>)
                    if (props.right)
                        a.splice(0, 0, <img key={1} src={props.image} className="list_text_image"></img>)
                    else
                        a.push(<img key={1} src={props.image} className="list_text_image"></img>)
                    return a
                })()
            }
        </div>
    </>
}

addEventListener("scroll",_=>{
    setAllBackgroundColor(document.scrollingElement?.scrollTop!/(document.scrollingElement?.scrollHeight!-document.scrollingElement?.clientHeight!)*-0.5+1)
})

function HomeVersionListElement(props: {type: "beta" | "release"}) {
    const [version, setVersion] = useState(newest_versions[props.type])

    versionSetter[props.type] = setVersion

    return <div className="version_list_element">
        <div onClick={_=>{
            open(version.files[0].url)
        }} className="version_list_button">
            <span className="material-symbols-outlined">
                download
            </span>
        </div>
        {(props.type==="beta"?"Beta: ":"")+(version.name??"loading...")}
    </div>
}

function IconImage(props: {icon: string, url: string}) {
    return <a href={props.url} className="home_website_icon"><img src={props.icon+".png"}></img></a>
}

function Headline() {
    return <div className="headline_title">
        Bewisclient
    </div>
}

function UpArrow() {
    const [opacity, setOpacity] = useState(0)

    useEffect(()=>{
        setOpacity(scrollY>0?1:0)
    })

    return <div style={{opacity: opacity, left: (opacity*6-5)+"rem"}} className="up_button">
        <span className="material-symbols-outlined">
            arrow_upward
        </span>
    </div>
}