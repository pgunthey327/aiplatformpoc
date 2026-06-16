const CustomAccordionHeader = ({ data }) => {
    return <div className="w-full flex flex-1 p-1">
        <div className="w-full flex-row">
            <div className="flex justify-between">
                <div>{`Prompt : ${data?.input}`}</div>
                <div>{`Prompt : ${data?.latency}`}</div>
            </div>

            <div className="max-w-[30%] truncate">{`Response : ${data?.output}`}</div>
        </div>
    </div>
}


const CustomAccordionBody = ({ data }) => {
    return <div className="flex ">
        <span>span1</span>
        <span>span2</span>
    </div>
}

export { CustomAccordionHeader, CustomAccordionBody }