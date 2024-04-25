'use client'
import React, { useState } from "react";
import Image, { ImageProps } from "next/image";

const ImageWrapper = (props: ImageProps) => {
  const { src, width, height, className, alt, ...rest } = props;
  const [showText, setShowText] = useState(false);

  if(showText) {
    return <div className="text-sm cursor-pointer">{alt}</div>
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        setShowText(true);
      }}
    />
  );
};

export default ImageWrapper;
