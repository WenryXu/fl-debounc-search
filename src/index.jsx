import React, { useRef, useState, useMemo } from 'react';
import classes from './index.module.scss';
import { makeStyles, Input, Button, shorthands } from '@fluentui/react-components';
import { Search24Regular, DismissRegular } from '@fluentui/react-icons';
import _ from 'lodash';

const useStyles = makeStyles({
  input: {
    width: '100%',
    paddingRight: '0px',
    height: '32px',
    '&:after': { display: 'none' },
    ...shorthands.borderColor('#d1d1d1'),
  },
});

const Highlight = ({ text, keyword }) => {
  return text
    .split(keyword)
    .flatMap((str, index) => [
      <span key={index} style={{ color: 'red' }}>
        {keyword}
      </span>,
      str,
    ])
    .slice(1);
};

const FlDebounceSearch = ({ placeholder = '', fetchOptions, debounceTimeout = 800, showOptions = true, onSearch, onClear, maxHeight = 300 }) => {
  const styles = useStyles();
  const inputEl = useRef(null);
  const [value, setValue] = useState('');
  const isClear = useRef(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);
  // eslint-disable-next-line
  const [fetching, setFetching] = useState(false);
  const cancelFetcherRef = useRef(null);
  const [open, setOpen] = useState(false);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value) => {
      if (!value.trim()) {
        setOpen(false);
        setOptions([]);
        return;
      }
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setOpen(false);
      setFetching(true);

      fetchOptions(value.trim()).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          return;
        }
        setOptions(newOptions);
        setOpen(true);
        setFetching(false);
      });
    };
    const debounceFetch = _.debounce(loadOptions, debounceTimeout);
    cancelFetcherRef.current = debounceFetch;
    return debounceFetch;
  }, [fetchOptions, debounceTimeout]);

  const clearValue = () => {
    setValue('');
    onClear();
    setOptions([]);
    setFetching(false);
    setOpen(false);
    fetchRef.current = 0;
  };

  const searchData = (value) => {
    onSearch(value.trim());
  };

  const _onSearch = (keywords) => {
    setValue(keywords ?? value);
    setOptions([]);
    searchData(value);
  };

  return (
    <div className={classes.mask}>
      <div className={classes.container}>
        <div className={classes.inputContainer}>
          <Input
            ref={inputEl}
            contentBefore={<Search24Regular />}
            contentAfter={
              value.trim().length > 0 ? (
                <Button
                  appearance="subtle"
                  icon={{ children: <DismissRegular /> }}
                  onMouseDown={(evt) => {
                    isClear.current = true;
                    evt.stopPropagation();
                  }}
                  onClick={() => {
                    isClear.current = false;
                    clearValue();
                    inputEl.current?.focus();
                  }}
                />
              ) : (
                <></>
              )
            }
            className={styles.input}
            value={value}
            onChange={(_, data) => {
              if (!_) return;
              setValue(data.value);
              debounceFetcher(data.value);
            }}
            placeholder={placeholder}
            onKeyUp={(evt) => {
              if (evt.code.toLocaleLowerCase() === 'enter') {
                if (value.trim().length > 0) {
                  _onSearch();
                  cancelFetcherRef.current?.cancel();
                } else {
                  clearValue();
                }
              }
            }}
            onBlur={() => {
              if (isClear.current) return;
              setOpen(false);
            }}
          />
        </div>

        {showOptions && open && (
          <div className={classes.historyContainer} style={{ maxHeight }}>
            {options.map((option) => (
              <p
                key={option.value}
                onMouseDown={() => {
                  _onSearch(option.label);
                }}
                style={{ cursor: 'pointer', padding: '6px 18px', margin: 0 }}
              >
                <Highlight text={option.label} keyword={value.trim()} />
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlDebounceSearch;
