import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const SlideTabs = ({ activeCategory, onCategoryChange }) => {
    const [position, setPosition] = useState({
        left: 0,
        width: 0,
        opacity: 0,
    });

    const categories = ['Milk Tea', 'Fruit', 'Blended'];

    const handleMouseLeave = () => {
        setPosition({
            left: position.left,
            width: position.width,
            opacity: 0,
        });
    };

    return (
        <ul
            onMouseLeave={handleMouseLeave}
            className="relative mx-auto flex w-fit rounded-full border-2 border-black bg-white p-1"
        >
            {categories.map(category => (
                <Tab
                    key={category}
                    setPosition={setPosition}
                    isActive={activeCategory === category}
                    onClick={() => onCategoryChange(category)}
                >
                    {category}
                </Tab>
            ))}

            <Cursor position={position} />
        </ul>
    );
};

const Tab = ({ children, setPosition, isActive, onClick }) => {
    const ref = useRef(null);

    const handleMouseEnter = () => {
        if (!ref?.current) return;

        const { width } = ref.current.getBoundingClientRect();

        setPosition({
            left: ref.current.offsetLeft,
            width: width,
            opacity: 1,
        });
    };

    // Add active class if this tab is selected
    let tabClass = "relative z-10 block cursor-pointer px-3 py-1.5 text-white mix-blend-difference md:px-5 md:py-3 md:text-base";
    if (isActive) {
        tabClass = tabClass + " font-bold";
    }

    return (
        <li
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onClick={onClick}
            className={tabClass}
        >
            {children}
        </li>
    );
};

const Cursor = ({ position }) => {
    return (
        <motion.li
            animate={position}
            className="absolute z-0 h-7 rounded-full bg-black md:h-12"
        />
    );
};

export default SlideTabs;