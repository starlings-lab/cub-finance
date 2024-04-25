"use client";

import React, { ReactNode, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";

const PopoverWrapper = ({
  title,
  content
}: {
  title: ReactNode;
  content: ReactNode;
}) => {
  const isMobile = useMemo(
    () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    []
  );

  if (isMobile) {
    return (
      <Popover.Root>
        <Popover.Trigger className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
          {title}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-white rounded shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] select-none will-change-[transform,opacity] px-2 py-2.5 focus-visible:outline-0"
            sideOffset={5}
          >
            {content}
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  } else {
    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger className="cursor-pointer">
            {title}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-white rounded shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] select-none will-change-[transform,opacity] px-2 py-2.5"
              sideOffset={5}
            >
              {content}
              <Tooltip.Arrow className="fill-white" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }
};

export default PopoverWrapper;
