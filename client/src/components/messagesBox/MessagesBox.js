import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import useHttp from '../../hooks/useHttp';
import UserContext from '../../context/UserContext';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Editor, EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import { compositeDecorator, messageBoxDecorator } from '../../helpers/decorators';
import { ReactComponent as InfoIcon } from '../../assets/icons/info.svg';
import { ReactComponent as ImageIcon } from '../../assets/icons/image.svg';
import { ReactComponent as GifIcon } from '../../assets/icons/gif.svg';
import { ReactComponent as SmileIcon } from '../../assets/icons/smile.svg';
import { ReactComponent as PlaneIcon } from '../../assets/icons/plane.svg';

import './messagesBox.scss';

const convertToEditorState = (text) => {
    const content = convertFromRaw(JSON.parse(text));
    const editorStateReadonly = EditorState.createWithContent(content, messageBoxDecorator);
    return editorStateReadonly;
};

const MessagesBox = () => {
    const [messages, setMessages] = useState([]);
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty(compositeDecorator));
    const [disabled, setDisabled] = useState(true);
    const [offsetHeight, setOffsetHeight] = useState();
    const [socket, setSocket] = useState({});
    const { currentUser } = useContext(UserContext);
    const { request } = useHttp();
    const footerRef = useRef(null);
    const messagesRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        setSocket(io(process.env.REACT_APP_DOMAIN));
    }, [setSocket]);

    useEffect(() => {
        if (Object.keys(socket).length !== 0) {
            socket.on('thread message', (data) => {
                setMessages((prev) => [...prev, data]);
            });
        }
    }, [socket]);

    const params = useParams();
    const observer = useRef(
        new ResizeObserver((entries) => {
            const { offsetHeight } = entries[0].target;
            setOffsetHeight(offsetHeight);
        }),
    );

    const getMessages = useCallback(
        async (id) => {
            try {
                socket.emit('thread opened', { id });
                const response = await request(`/api/direct/messages?threadId=${id}`, 'GET');
                if (response && response.status === 200 && response.status !== 500) {
                    setMessages(response.messages);
                }
            } catch (e) {}
        },
        [request, socket],
    );

    const sendMessage = useCallback(async () => {
        try {
            const message_text = editorState.getCurrentContent().getPlainText();
            const draft_message_text = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
            setEditorState((prevState) => EditorState.push(prevState, ContentState.createFromText('')));
            await request('/api/direct/message/new', 'POST', {
                threadId: params.threadId,
                draft_message_text,
                message_text,
            });
            editorRef.current.focus();
        } catch (e) {}
    }, [request, editorState, params.threadId, socket, EditorState, ContentState]);

    useEffect(() => {
        if (footerRef.current) observer.current.observe(footerRef.current);
        return () => {
            observer.current.unobserve(footerRef.current);
        };
    }, [footerRef, observer]);

    useEffect(() => {
        messagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [offsetHeight, messages]);

    useEffect(() => {
        let isSubscribed = true;
        if (isSubscribed) getMessages(params.threadId);
    }, [getMessages, params.threadId]);

    return (
        <div className="messages__chat">
            <div className="messageBox" style={{ paddingBottom: `${offsetHeight}px` }}>
                <div className="messageBox__header">
                    <div className="messageBox__header--left">
                        <h2 className="messageBox__header-name">Gary Simon</h2>
                        <span className="messageBox__header-handle">@designcoursecom</span>
                    </div>
                    <div className="messageBox__header-icon" tabIndex="0">
                        <div className="messageBox__header-icon-inner" tabIndex="-1">
                            <InfoIcon />
                        </div>
                    </div>
                </div>
                <div className="messageBox__body relative">
                    <div className="messageBox__messages">
                        {messages.map((message, index) => (
                            <div
                                className={`messageBox__message ${
                                    message.sender_id === currentUser._id && 'messageBox__message--current'
                                }`}
                                key={index}
                            >
                                {message.sender_id !== currentUser._id && (
                                    <div className="messageBox__message-author-image"></div>
                                )}
                                <div
                                    className={`messageBox__message-container ${
                                        message.sender_id === currentUser._id &&
                                        'messageBox__message-container--current'
                                    }`}
                                >
                                    <div
                                        className={`messageBox__message-content ${
                                            message.sender_id === currentUser._id &&
                                            'messageBox__message-content--current'
                                        }`}
                                    >
                                        <Editor
                                            editorState={convertToEditorState(message.draft_message_text)}
                                            readOnly
                                        />
                                    </div>
                                    <span
                                        className={`messageBox__message-date ${
                                            message.sender_id === currentUser._id && 'messageBox__message-date--current'
                                        }`}
                                    >
                                        {format(new Date(message.createdAt), 'MMM dd, yyyy, KK:mm a')}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesRef}></div>
                    </div>
                </div>
                <div className="messageBox__footer" ref={footerRef}>
                    <div className="messageBox__footer-icon" tabIndex="0">
                        <div className="messageBox__footer-icon-inner" tabIndex="-1">
                            <ImageIcon />
                        </div>
                    </div>
                    <div className="messageBox__footer-icon" tabIndex="0">
                        <div className="messageBox__footer-icon-inner" tabIndex="-1">
                            <GifIcon />
                        </div>
                    </div>
                    <div className="messageBox__footer-input-group">
                        <div className="messageBox__footer-input">
                            <Editor
                                ref={editorRef}
                                editorState={editorState}
                                onChange={(editorState) => {
                                    const textLength = editorState.getCurrentContent().getPlainText().length;
                                    setDisabled(textLength < 1 ? true : false);
                                    setEditorState(editorState);
                                }}
                                placeholder="Start a new message"
                            />
                        </div>
                        <div className="messageBox__footer-icon messageBox__footer-input-icon" tabIndex="0">
                            <div
                                className="messageBox__footer-input-icon-inner messageBox__footer-icon-inner"
                                tabIndex="-1"
                            >
                                <SmileIcon />
                            </div>
                        </div>
                    </div>
                    <div
                        onClick={sendMessage}
                        className={`messageBox__footer-icon ${disabled && 'messageBox__footer-icon--disabled'}`}
                        tabIndex="0"
                    >
                        <div className="messageBox__footer-icon-inner" tabIndex="-1">
                            <PlaneIcon />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesBox;
