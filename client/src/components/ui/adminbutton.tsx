"use client";

import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import clsx from "clsx";

type Props = Omit<MuiButtonProps, "variant" | "color"> & {
  intent?: "primary" | "secondary";
};

export function Button({ intent = "primary", className, ...props }: Props) {
  const isPrimary = intent === "primary";

  return (
    <MuiButton
      {...props}
      disableElevation
      className={clsx(className)}
      variant={isPrimary ? "contained" : "outlined"}
      sx={{
        textTransform: "none",
        borderRadius: "12px",
        fontWeight: 600,
        borderColor: "rgba(0,0,0,0.10)",

        ...(isPrimary
          ? { backgroundColor: "#000", color: "#fff", "&:hover": { backgroundColor: "#000" } }
          : { color: "#000", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }),

        // remove focus glow
        "&.Mui-focusVisible": { outline: "none" },
      }}
    />
  );
}

export default Button;
