// import React, { InputHTMLAttributes } from "react";

// interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
//   label: string;
// }

// export function FloatingLabelInput({
//   id,
//   label,
//   className = "",
//   ...props
// }: FloatingLabelInputProps) {
//   const gradientBorder = (width: number) => ({
//     borderWidth: width,
//     borderStyle: "solid",
//     borderImage: "linear-gradient(90deg,#FFA135 0%,#FF7236 100%) 1"
//   });

//   return (
//     <div className={`relative w-full group ${className}`}>
//       <input
//         id={id}
//         {...props}
//         placeholder=" "
//         className="
//           peer block w-full
//           !rounded-full bg-white
//           px-4 py-2 text-gray-900
//           focus:outline-none
//           transition
//         "
//         // pill-shaped gradient border
//         style={gradientBorder(2)}
//       />

//       <label
//         htmlFor={id}
//         className="
//           absolute left-4 -top-2
//           bg-white px-2
//           text-sm text-gray-500
//           transition-all
//           peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
//           peer-focus:-top-2 peer-focus:text-sm
//         "
//         // pill with gradient border (width 1)
//         style={{ ...gradientBorder(0) }}
//       >
//         {label}
//       </label>
//     </div>
//   );
// }

// components/ui/FloatingLabelInput.tsx
import React, { InputHTMLAttributes } from "react";

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FloatingLabelInput({
  id,
  label,
  className = "",
  required,
  ...props
}: FloatingLabelInputProps) {
  return (
    <div className={`relative w-full group ${className}`}>
      <div
        className="
          overflow-hidden rounded-md
          p-[2px]
          bg-gray-300
          group-focus-within:bg-gradient-to-r
          group-focus-within:from-[#FFA135]
          group-focus-within:to-[#FF7236]
        "
      >
        <input
          id={id}
          placeholder=" "
          required={required}
          {...props}
          className="
            peer block w-full
            rounded-md
            bg-white
            px-3 py-2
            text-gray-900
            focus:outline-none focus:ring-0
            transition
          "
        />
      </div>

      {/* Floating label */}
      <label
        htmlFor={id}
        className="
          absolute left-3
          bg-white px-1
          transition-all
          -top-2 text-sm text-gray-500
          peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
          peer-focus:-top-2 peer-focus:text-sm
          peer-focus:bg-gradient-to-r peer-focus:from-[#FFA135] peer-focus:to-[#FF7236]
          peer-focus:bg-clip-text peer-focus:text-transparent
        "
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    </div>
  );
}