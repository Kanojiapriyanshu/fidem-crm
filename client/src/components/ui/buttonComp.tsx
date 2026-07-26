// components/ui/button.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const RAISED_SHADOW =
  "shadow-[0_0.125rem_0.25rem_-0.125rem_rgba(0,0,0,0.08),0_0.25rem_0.5rem_-0.125rem_rgba(0,0,0,0.04)]";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap my-2",
    "select-none",
    "gap-s",
    "transition-colors",
    "cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "[&>span[data-slot='icon']]:inline-flex [&>span[data-slot='icon']]:shrink-0",
    "[&>span[data-slot='label']]:inline-flex [&>span[data-slot='label']]:items-center",
    "[&>span[data-slot='icon']>svg]:pointer-events-none",
    "rounded-[0.75rem]", 
    RAISED_SHADOW,
  ].join(" "),
  {
    variants: {
      variant: {
        solid: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 active:bg-primary/95"
        ),
        outline: cn(
          "bg-background text-foreground border border-bd-focus",
          "hover:bg-bg-hover active:bg-bg-pressed"
        ),
        raised: cn(
          "bg-background text-foreground",
          "hover:bg-bg-hover active:bg-bg-pressed"
        ),
      },
      size: {
        sm: cn("h-3xl px-l cg-label-s", "[&>span[data-slot='icon']>svg]:size-4"),
        md: cn(
          "h-4xl px-xl cg-label-m",
          "[&>span[data-slot='icon']>svg]:size-[1.125rem]"
        ),
        lg: cn("h-5xl px-2xl cg-label-l", "[&>span[data-slot='icon']>svg]:size-5"),
      },
      loading: {
        true: "pointer-events-none cursor-wait",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "solid", loading: true, className: "bg-primary/90" },
      { variant: "outline", loading: true, className: "bg-bg-hover" },
      { variant: "raised", loading: true, className: "bg-bg-hover" },
    ],
    defaultVariants: {
      variant: "solid",
      size: "md",
      loading: false,
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  loadingPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      leftIcon,
      rightIcon,
      children,
      isLoading = false,
      loadingPosition = "left",
      disabled,
      type,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled) || isLoading;

    // Spinner sizing
    const spinnerSize =
      size === "sm" ? "size-4" : size === "lg" ? "size-5" : "size-[1.125rem]";
    const spinnerNode = <Spinner className={spinnerSize} />;

    const showLeftSpinner = isLoading && loadingPosition === "left";
    const showRightSpinner = isLoading && loadingPosition === "right";

    // For normal button, label is `children`
    const hasText = React.Children.count(children) > 0;

    const content = (
      <>
        {/* LEFT */}
        {showLeftSpinner ? (
          <span data-slot="icon" aria-hidden="true">
            {spinnerNode}
          </span>
        ) : leftIcon ? (
          <span data-slot="icon" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {/* LABEL */}
        {hasText ? (
          <span
            data-slot="label"
            className={cn(
              "transition-opacity",
              isLoading && !showLeftSpinner && !showRightSpinner && "opacity-70"
            )}
          >
            {children}
          </span>
        ) : null}

        {/* RIGHT */}
        {showRightSpinner ? (
          <span data-slot="icon" aria-hidden="true">
            {spinnerNode}
          </span>
        ) : rightIcon ? (
          <span data-slot="icon" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </>
    );

    const classes = cn(
      buttonVariants({ variant, size, loading: isLoading }),
      !hasText && "px-s",
      className
    );

    // ✅ asChild: expect ONE element (e.g., <Link />), clone it and inject our content
    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<any>;

      const mergedOnClick: React.MouseEventHandler<any> = (e) => {
        if (isDisabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        child.props?.onClick?.(e);
        onClick?.(e as any);
      };

      return React.cloneElement(child, {
        ...props,
        onClick: mergedOnClick,
        className: cn(classes, child.props?.className),
        "aria-disabled": isDisabled || undefined,
        "aria-busy": isLoading || undefined,
        "data-loading": isLoading ? "true" : "false",
        children: content,
      });
    }
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        data-loading={isLoading ? "true" : "false"}
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
