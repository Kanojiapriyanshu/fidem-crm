"use client"
import ReactQuill, { Quill } from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const Font = Quill.import('formats/font') as any
Font.whitelist = ['inter', 'arial', 'georgia', 'times-new-roman', 'courier-new', 'verdana', 'trebuchet-ms']
Quill.register(Font, true)

interface Props {
    quillRef: React.RefObject<any>
    placeholder?: string
    onChangeSelection?: () => void
    onTextChange?: () => void
}

export default function QuillEditor({ quillRef, placeholder, onChangeSelection, onTextChange }: Props) {
    return (
        <>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                modules={{ toolbar: false, history: { delay: 1000, maxStack: 100, userOnly: true } }}
                formats={['bold', 'italic', 'underline', 'align', 'list', 'link', 'image', 'font', 'color']}
                placeholder={placeholder}
                className="quill-mail-editor !h-[26.375rem] !w-[26.375rem]"
                onChangeSelection={onChangeSelection}
                onChange={onTextChange}
            />
            <style>{`
               .quill-mail-editor .ql-toolbar { display: none; }
    
               .ql-font-inter { font-family: 'Inter', sans-serif; }
               .ql-font-arial { font-family: Arial, sans-serif; }
               .ql-font-georgia { font-family: Georgia, serif; }
               .ql-font-times-new-roman { font-family: 'Times New Roman', Times, serif; }
               .ql-font-courier-new { font-family: 'Courier New', Courier, monospace; }
               .ql-font-verdana { font-family: Verdana, sans-serif; }
               .ql-font-trebuchet-ms { font-family: 'Trebuchet MS', sans-serif; }

               .quill-mail-editor .ql-container {
                border: none !important;
                font-family: 'Inter', sans-serif;
                font-size: 0.875rem;
               }
            `}</style>
        </>
    )
}