/*
Use whenever text needs translation
Use case: <TranslatedText text="text to be translated" />
Remember to import this file as import TranslatedText from "../../common/TranslateText.jsx";
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/translation-storage.jsx';

export default function TranslatedText({ text }) {
    const { translate } = useTranslation();
    const [value, setValue] = useState(text);

    useEffect(() => {
        let active = true;

        async function run() {
            const translated = await translate(text);
            if (active) {
                setValue(translated);
            }
        }

        run();
        return () => { active = false; };
    }, [text, translate]);

    return value;
}