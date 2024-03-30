/* eslint-disable no-loop-func */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-concat */
/* eslint-disable no-sequences */
/* eslint-disable import/no-duplicates */
/* eslint-disable no-self-compare */
/* eslint-disable no-const-assign */
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import Slider from 'react-slick';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { bindActionCreators } from 'redux';
import axios from 'axios';
import { Row, Col, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import MainLayout from 'containers/Layout/MainLayout';
import { connectAccount, accountActionCreators } from 'core';
import {
  useFarmingContract,
  useInstance,
  useLPContract,
  useNFTContract,
  usePrimeRewardPoolContract,
  useProvider,
  useSTRKClaimContract,
  useVSTRKContract
} from 'hooks/useContract';
import * as constants from 'utilities/constants';
import NftMintModal from 'components/Basic/NftMintModal';
import { checkIsValidNetwork } from 'utilities/common';
import { useRewardData } from 'hooks/useReward';
import { restService } from 'utilities';
import {
  DECIMALS_INPUT,
  MIXIMUM_IPUT,
  DECIMALS_LP,
  divDecimals,
  renderValueFixed,
  renderValueDecimal,
  divDecimalsBigNumber,
  showAllNumber,
  MAX_APPROVE,
  MINIMUM_VALUE,
  MINIMUM_VALUE_FORMAT,
  SECOND24H,
  SECOND2DAY,
  SECOND30DAY,
  TIME_UPDATE_NFT,
  PERCENT_APR,
  MAX_STAKE_NFT,
  SETTING_SLIDER,
  UNSTAKE,
  CLAIMBASE,
  CLAIMBOOST,
  UNSTAKENFT,
  GET_NFT_URL
} from './helper';
// eslint-disable-next-line import/named
import { axiosInstance } from '../../../utilities/axios';
import '../../../assets/styles/slick.scss';
import * as ST from '../../../assets/styles/staking.js';
// eslint-disable-next-line import/no-duplicates
import DialogConfirm from './DialogConfirm';
import DialogErr from './DialogErr';
import { methods } from '../../../utilities/ContractService';
import DashboardStaking from './Dashboard';
import CountDownClaim from './countDownClaim';
import DialogSuccess from './DialogSuccess';
import DialogUnStake from './DialogUnStake';
import DialogStake from './DialogStake';
// eslint-disable-next-line import/no-named-as-default
import Loadding from './Loadding';
// eslint-disable-next-line import/order
import IconQuestion from '../../../assets/img/error-outline.svg';
import IconLink from '../../../assets/img/launch.svg';
import IconLinkBlue from '../../../assets/img/link_blue.svg';
import IconNoData from '../../../assets/img/no_data.svg';
import IConNext from '../../../assets/img/arrow-next.svg';
import IConPrev from '../../../assets/img/arrow-prev.svg';
import IconFlashSmall from '../../../assets/img/flash_small.svg';
import IconLpSmall from '../../../assets/img/lp_small.svg';
import dividerImg from '../../../assets/img/divider.svg';
import { THE_GRAPH, HEADER } from '../../../utilities/constants';

// eslint-disable-next-line import/order
function SampleNextArrow(props) {
  // eslint-disable-next-line react/prop-types
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, background: IConNext, display: 'block' }}
      onClick={onClick}
    />
  );
}
function SamplePrevArrow(props) {
  // eslint-disable-next-line react/prop-types
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, background: IConPrev, display: 'block' }}
      onClick={onClick}
    />
  );
}
const AUDITOR_SETTING = {
  ...SETTING_SLIDER,
  nextArrow: <SampleNextArrow />,
  prevArrow: <SamplePrevArrow />
};
const abortController = new AbortController();
// eslint-disable-next-line react/prop-types
function Staking({ settings, setSetting, intl }) {
  const numberFormat = Intl.NumberFormat('en-US');
  const instance = useInstance(settings.walletConnected);
  const provider = useProvider(settings.walletConnected);
  const address = settings.selectedAddress;
  const [val, setVal] = useState('');
  const [isMaxValue, setIsMaxValue] = useState(false);
  const [isMaxValueUnStake, setIsMaxValueUnStake] = useState(false);
  const [valUnStake, setValUnStake] = useState('');
  const [messErr, setMessErr] = useState({
    mess: '',
    show: false,
    noLP: false
  });
  const [messErrUnStake, setMessErrUnStake] = useState({
    mess: '',
    show: false,
    noLP: false
  });
  const [messConfirm, setMessConfirm] = useState('');
  const [txhash, setTxhash] = useState('');
  const [dataNFT, setDataNFT] = useState([]);
  const [dataNFTUnState, setDataNFTUnState] = useState([]);
  const [textErr, setTextErr] = useState('');
  const [textSuccess, setTextSuccess] = useState('');
  const [isStakeNFT, setIsStakeNFT] = useState(false);
  const [isUnStakeNFT, setIsUnStakeNFT] = useState(false);
  const [isConfirm, setiIsConfirm] = useState(false);
  const [isShowCancel, setIsShowCancel] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBtn, setIsLoadingBtn] = useState(false);
  const [isLoadingUnStake, setIsLoadingUnStake] = useState(false);
  const [isDisableStakeNFTDialog, setIsDisableStakeNFTDialog] = useState(false);
  const [isDisableUnStakeNFTDialog, setIsDisableUnStakeNFTDialog] = useState(
    false
  );
  const [isApproveLP, setIsApproveLP] = useState(true);
  const [isApproveNFT, setIsApproveNFT] = useState(false);
  const [isAprroveVstrk, setIsAprroveVstrk] = useState(false);
  const [isClaimBaseReward, setisClaimBaseReward] = useState(false);
  const [isClaimBootReward, setIsClaimBootReward] = useState(false);
  const [disabledBtn, setDisabledBtn] = useState(false);
  const [disabledBtnUn, setDisabledBtnUn] = useState(false);
  const [countNFT, setCounNFT] = useState(0);
  const [isUnStakeLp, setIsUnStakeLp] = useState(false);
  const [isShowCountDownUnStake, setIsShowCountDownUnStake] = useState(false);
  const [isShowCountDownClaimBase, setIsShowCountDownClaimBase] = useState(
    false
  );
  const [isShowCountDownClaimBoost, setIsShowCountDownClaimBoost] = useState(
    false
  );
  const [isShowCountDownUnStakeNFT, setIsShowCountDownUnStakeNFT] = useState(
    false
  );

  const [itemStaking, setItemStaking] = useState([]);
  const [itemStaked, setItemStaked] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [yourBoostAPR, setYourBoostAPR] = useState(0);
  const [valueNFTStake, setValueNFTStake] = useState('');
  const [valueNFTUnStake, setValueNFTUnStake] = useState('');
  const [fakeImgNFT, setFakeImgNFT] = useState('');
  const [isOpenNftMintModal, setIsOpenNftMintModal] = useState(false);

  const [claimBaseRewardTime, setClaimBaseRewardTime] = useState(0);
  const [claimBoostRewardTime, setClaimBoostRewardTime] = useState(0);
  const [unstakableTime, setUnstakableTime] = useState(0);
  const [refresh, setRefresh] = useState(0);

  const {
    stakingPoint,
    estimatedReward,
    claimableReward,
    totalReserveReward,
    reservePrimeApy
  } = useRewardData(address, refresh);

  // contract
  const farmingContract = useFarmingContract(instance);
  const lpContract = useLPContract(instance);
  const vStrkContract = useVSTRKContract(instance);
  const nFtContract = useNFTContract(instance);
  const strkContract = useSTRKClaimContract(instance);
  const primeRewardPoolContract = usePrimeRewardPoolContract(instance);
  // get userInfor
  useMemo(async () => {
    let sTokenBalance = null;
    let decimalLp = null;
    let decimalStrkClaim = null;
    if (address) {
      sTokenBalance = await methods.call(lpContract.methods.balanceOf, [
        address
      ]);
    }
    const objClaim = {
      accBaseReward: '',
      accBoostReward: ''
    };
    let objUser = {};
    if (address) {
      await methods
        .call(lpContract.methods.decimals, [])
        .then(res => {
          decimalLp = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(strkContract.methods.decimals, [])
        .then(res => {
          decimalStrkClaim = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(farmingContract.methods.pendingBaseReward, [0, address])
        .then(res => {
          objClaim.accBaseReward = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(farmingContract.methods.pendingBoostReward, [0, address])
        .then(res => {
          objClaim.accBoostReward = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(farmingContract.methods.userInfo, [0, address])
        .then(res => {
          const balanceBigNumber = divDecimals(sTokenBalance, decimalLp);
          const pendingAmountNumber = divDecimals(res.pendingAmount, decimalLp);
          const amountNumber = divDecimals(res.amount, decimalLp);
          const totalAmount = amountNumber.plus(pendingAmountNumber);
          const totalUnStake = new BigNumber(res?.pendingAmount).plus(
            new BigNumber(res?.amount)
          );
          const totalAmountNumber = totalAmount.toNumber();
          const accBaseRewardBigNumber = divDecimals(
            objClaim.accBaseReward,
            decimalStrkClaim
          );
          const accBoostRewardBigNumber = divDecimals(
            objClaim.accBoostReward,
            decimalStrkClaim
          );
          const accBaseRewardString = accBaseRewardBigNumber.toNumber();
          const accBoostRewardString = accBoostRewardBigNumber.toNumber();
          const balanceBigFormat = balanceBigNumber.toNumber().toString();
          const totalAmountBigNumber = totalAmount.toNumber().toString();
          if (balanceBigNumber.isZero()) {
            setMessErr({
              mess: <FormattedMessage id="No_token_to_stake" />,
              show: false,
              noLP: true
            });
          } else {
            setMessErr({
              mess: '',
              show: false,
              noLP: false
            });
          }
          const timeBaseUnstake = +res.depositedDate;
          const timeBootsUnstake = +res.boostedDate;
          // const currentTime = Math.floor(new Date().getTime() / 1000);
          // const overTimeBaseReward = currentTime - timeBaseUnstake;
          // const overTimeBootReward = currentTime - timeBootsUnstake;
          // if (timeBaseUnstake === 0) {
          //   setisClaimBaseReward(false);
          //   setIsUnStakeLp(false);
          // } else {
          //   setisClaimBaseReward(overTimeBaseReward >= SECOND24H);
          //   if (overTimeBaseReward >= SECOND2DAY) {
          //     setIsUnStakeLp(true);
          //   } else {
          //     setIsUnStakeLp(false);
          //   }
          // }
          // if (timeBootsUnstake === 0) {
          //   setIsClaimBootReward(false);
          // } else {
          //   setIsClaimBootReward(overTimeBootReward >= SECOND30DAY);
          // }
          if (accBaseRewardString > 0) {
            setisClaimBaseReward(true);
          } else {
            setisClaimBaseReward(false);
          }
          if (accBoostRewardString > 0) {
            setIsClaimBootReward(true);
          } else {
            setIsClaimBootReward(false);
          }
          objUser = {
            ...res,
            amount: renderValueFixed(totalAmountBigNumber),
            amountNumber: totalAmountNumber,
            available: renderValueFixed(balanceBigFormat).toString(),
            availableNumber: balanceBigNumber.toNumber(),
            availableMax: sTokenBalance,
            amountMax: totalUnStake,
            accBaseReward: renderValueFixed(accBaseRewardString),
            accBoostReward: renderValueFixed(accBoostRewardString),
            depositedDate: timeBaseUnstake,
            boostedDate: timeBootsUnstake,
            decimalLp
          };
        })
        .catch(err => {
          throw err;
        });
      if (address) {
        await axiosInstance
          .get('/user/total_claim', {
            params: {
              user_address: address
            }
          })
          .then(res => {
            const totalClaim = divDecimals(
              res.data.data.totalClaim,
              decimalLp
            ).toNumber();
            setUserInfo({
              ...objUser,
              totalClaim: totalClaim ? renderValueFixed(totalClaim) : '0.0'
            });
          });
      }
    }
  }, [address, txhash]);

  useEffect(() => {
    const fetchTimes = async () => {
      await methods
        .call(farmingContract.methods.unstakableTime, [])
        .then(res => {
          if (res) {
            setUnstakableTime(res);
          }
        })
        .catch(err => {
          throw err;
        });

      await methods
        .call(farmingContract.methods.claimBaseRewardTime, [])
        .then(res => {
          if (res) {
            setClaimBaseRewardTime(res);
          }
        })
        .catch(err => {
          throw err;
        });

      await methods
        .call(farmingContract.methods.claimBoostRewardTime, [])
        .then(res => {
          if (res) {
            setClaimBoostRewardTime(res);
          }
        })
        .catch(err => {
          throw err;
        });
    };
    fetchTimes();
  }, []);

  // get base boost available realtime
  const getBaseBoostRealTime = async () => {
    if (address) {
      let objUser = {};
      let decimalStrkClaim = null;
      let sTokenBalance = null;
      let decimalLp = null;
      let totalClaim = null;
      const objClaim = {
        accBaseReward: '',
        accBoostReward: ''
      };
      await methods
        .call(strkContract.methods.decimals, [])
        .then(res => {
          decimalStrkClaim = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(farmingContract.methods.pendingBaseReward, [0, address])
        .then(res => {
          objClaim.accBaseReward = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(farmingContract.methods.pendingBoostReward, [0, address])
        .then(res => {
          objClaim.accBoostReward = res;
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(lpContract.methods.decimals, [])
        .then(res => {
          decimalLp = res;
        })
        .catch(err => {
          throw err;
        });
      sTokenBalance = await methods.call(lpContract.methods.balanceOf, [
        address
      ]);
      await axiosInstance
        .get('/user/total_claim', {
          params: {
            user_address: address
          }
        })
        .then(res => {
          totalClaim = divDecimals(
            res?.data?.data?.totalClaim,
            decimalLp
          ).toNumber();
        });
      const accBaseRewardBigNumber = divDecimals(
        objClaim.accBaseReward,
        decimalStrkClaim
      );
      const accBoostRewardBigNumber = divDecimals(
        objClaim.accBoostReward,
        decimalStrkClaim
      );
      const accBaseRewardString = accBaseRewardBigNumber.toNumber();
      const accBoostRewardString = accBoostRewardBigNumber.toNumber();
      const balanceBigNumber = divDecimals(sTokenBalance, decimalLp);
      const balanceBigFormat = balanceBigNumber.toNumber().toString();
      objUser = {
        ...userInfo,
        accBaseReward: renderValueFixed(accBaseRewardString),
        accBoostReward: renderValueFixed(accBoostRewardString),
        available: renderValueFixed(balanceBigFormat).toString(),
        availableNumber: balanceBigNumber.toNumber(),
        totalClaim: totalClaim ? renderValueFixed(totalClaim) : '0.0'
      };
      setUserInfo({ ...objUser });
    }
  };

  const fetchNfts = async () => {
    let nftName = '';
    await methods
      .call(nFtContract.methods.name, [])
      .then(res => {
        if (res) {
          nftName = res;
        }
      })
      .catch(err => {
        throw err;
      });
    await axios
      .post(
        THE_GRAPH,
        {
          query: `{
                  tokens(first: 1000, orderBy: id, orderDirection:desc , where:{user:"${address?.toLowerCase()}"})  {
                    id
                    tokenId
                    user
                  }
                }`
        },
        {
          headers: HEADER
        }
      )
      .then(res => {
        const result = res?.data?.data?.tokens;
        if (result && result.length > 0) {
          const dataConvert = _.cloneDeep(result);
          if (dataConvert.length > 0) {
            // eslint-disable-next-line array-callback-return
            dataConvert.map(item => {
              item.active = false;
              item.name = `${nftName}${' #'}${item.id}`;
              item.id = +item.id;
              item.img = `${constants.URL_LOGO_NFT}/${item.id}.png`;
              item.token_id = item.id;
            });
            const dataStakeClone = _.cloneDeep(dataConvert);
            setDataNFT(dataStakeClone);
          }
          setIsLoading(false);
        } else {
          setDataNFT([]);
        }
      });
  };
  // get data NFT stake
  useMemo(async () => {
    if (!address) {
      setIsLoading(false);
      setDataNFT([]);
      return;
    }
    setIsLoading(true);
    try {
      await fetchNfts();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [address]);
  // get data NFT staked
  const fetchStakedNfts = async () => {
    let newArray = null;
    let nftName = '';
    await methods
      .call(nFtContract.methods.name, [])
      .then(res => {
        if (res) {
          nftName = res;
        }
      })
      .catch(err => {
        throw err;
      });
    await methods
      .call(farmingContract.methods.getUserInfo, [0, address])
      .then(res => {
        if (res && res.boostFactors.length > 0) {
          const lstStakedId = res.boostFactors;
          const dataCovert = [...lstStakedId];
          setCounNFT(dataCovert.length);
          newArray = dataCovert?.map(item => {
            // eslint-disable-next-line no-return-assign
            return (item = {
              name: `${nftName} ` + `#${item}`,
              token_id: item,
              id: +item,
              active: false,
              img: `${constants.URL_LOGO_NFT}/${item}.png`
            });
          });
          const lengthArr = newArray.length;
          if (lengthArr === 0 || lengthArr === 1) {
            setYourBoostAPR(0);
          } else {
            const yourBoostAPRPer = PERCENT_APR * lengthArr;
            setYourBoostAPR(yourBoostAPRPer);
          }
          setDataNFTUnState(newArray);
          setIsLoading(false);
        } else {
          setDataNFTUnState([]);
          setCounNFT(0);
          setYourBoostAPR(0);
        }
      });
  };

  useMemo(async () => {
    if (!address) {
      setIsLoading(false);
      setDataNFTUnState([]);
      return;
    }
    setIsLoading(true);
    try {
      await fetchStakedNfts();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  }, [address]);

  const expiryTimeUnstakeLP = useMemo(() => {
    if (userInfo.depositedDate && unstakableTime) {
      const result = new Date(
        userInfo.depositedDate * 1000 + unstakableTime * 1000
      );

      const currentDateTime = new Date();
      const afterStakeSeconds =
        currentDateTime.getTime() / 1000 - result.getTime() / 1000;
      if (afterStakeSeconds > 0) {
        setIsShowCountDownUnStake(false);
      } else {
        setIsShowCountDownUnStake(true);
      }
      const timeInterval = setInterval(() => {
        if (afterStakeSeconds > 0) {
          setIsShowCountDownUnStake(false);
        }
        clearInterval(timeInterval);
      }, 2000);
      return result;
    }
  }, [address, txhash, isApproveLP, userInfo, unstakableTime]);

  // time claim base reward countdown
  const expiryTimeBase = useMemo(() => {
    if (userInfo.depositedDate && claimBaseRewardTime) {
      const result = new Date(
        userInfo.depositedDate * 1000 + claimBaseRewardTime * 1000
      );
      const currentDateTime = new Date();
      const afterStakeSeconds =
        currentDateTime.getTime() / 1000 - result.getTime() / 1000;

      if (afterStakeSeconds > 0) {
        setIsShowCountDownClaimBase(false);
      } else {
        setIsShowCountDownClaimBase(true);
      }
      const timeInterval = setInterval(() => {
        if (afterStakeSeconds > 0) {
          setIsShowCountDownClaimBase(false);
        }
        clearInterval(timeInterval);
      }, 2000);
      return result;
    }
  }, [address, txhash, isApproveLP, userInfo, claimBaseRewardTime]);

  // time claim boost reward count down
  const expiryTimeBoost = useMemo(() => {
    if (userInfo.boostedDate && claimBoostRewardTime) {
      const result = new Date(
        userInfo.boostedDate * 1000 + claimBoostRewardTime * 1000
      );
      const currentDateTime = new Date();
      const afterStakeSeconds =
        currentDateTime.getTime() / 1000 - result / 1000;

      if (afterStakeSeconds > 0) {
        setIsShowCountDownClaimBoost(false);
      } else {
        setIsShowCountDownClaimBoost(true);
      }
      const timeInterval = setInterval(() => {
        if (afterStakeSeconds > 0) {
          setIsShowCountDownClaimBoost(false);
        }
        clearInterval(timeInterval);
      }, 2000);
      return result;
    }
  }, [address, txhash, isApproveLP, userInfo, claimBoostRewardTime]);

  const expiryTimeUnstakeNFT = useMemo(() => {
    if (userInfo) {
      let result = null;
      const overOneDate = new Date(userInfo.depositedDate * 1000);
      if (process.env.REACT_APP_ENV === 'prod') {
        result = overOneDate.setDate(overOneDate.getDate() + 2); // 2 days
      } else {
        result = overOneDate.setMinutes(overOneDate.getMinutes() + 4); // 4 minute
      }
      const currentDateTime = new Date();
      const resultInSecondsCurrent = Math.floor(
        currentDateTime.getTime() / 1000
      );
      const afterStakeSeconds = Math.floor(
        resultInSecondsCurrent - result / 1000
      );

      if (afterStakeSeconds > 0) {
        setIsShowCountDownUnStakeNFT(false);
      } else {
        setIsShowCountDownUnStakeNFT(true);
      }

      const timeInterval = setInterval(() => {
        if (afterStakeSeconds > 0) {
          setIsShowCountDownUnStakeNFT(false);
        }
        clearInterval(timeInterval);
      }, 2000);
      return result;
    }
  }, [address, txhash, isApproveNFT, userInfo]);
  // change amount
  const enforcer = nextUserInput => {
    const numberDigitsRegex = /^\d*(\.\d{0,18})?$/g;
    if (nextUserInput === '' || numberDigitsRegex.test(nextUserInput)) {
      setVal(nextUserInput);
    }
  };
  const enforcerUnStake = nextUserInput => {
    const numberDigitsRegexUn = /^\d*(\.\d{0,18})?$/g;
    if (nextUserInput === '' || numberDigitsRegexUn.test(nextUserInput)) {
      setValUnStake(nextUserInput);
    }
  };
  const replaceValue = value => {
    const valueFormat = value.replace(/,/g, '.');
    const lstValueFormat = valueFormat?.toString().split('.');
    if (lstValueFormat.length > 1) {
      const result = `${lstValueFormat[0]}.${lstValueFormat[1]?.slice(
        0,
        DECIMALS_INPUT
      )}`;
      return Number(result);
    }
  };
  // ear input value
  useMemo(() => {
    if (Number(val) > +userInfo?.availableNumber) {
      setMessErr({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
    }
  }, [val, userInfo]);
  useMemo(() => {
    if (Number(valueNFTUnStake) > +userInfo?.amountNumber) {
      setMessErrUnStake({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
    }
  }, [valUnStake, userInfo]);
  const handleChangeValue = event => {
    enforcer(event.target.value.replace(/,/g, '.'));
    const numberDigitsRegex = /^\d*(\.\d{0,18})?$/g;
    if (!numberDigitsRegex.test(event.target.value)) {
      return;
    }
    setMessErr({
      mess: '',
      show: false
    });
    const number = event.target.value;
    setIsMaxValue(false);
    if (number === '') {
      setMessErr({
        mess: '',
        show: false
      });
    }
    if (number !== '' && Number(number) === 0) {
      setMessErr({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
      setDisabledBtn(true);
    } else {
      setMessErr({
        mess: '',
        show: false
      });
      setDisabledBtn(false);
    }
    if (Number(number) > +userInfo?.availableNumber) {
      setMessErr({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      setDisabledBtn(true);
    }
    if (Number(number) && !+userInfo?.availableNumber) {
      setMessErr({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      setDisabledBtn(true);
    }
    if (Number(number) < 0) {
      setVal(0);
    } else if (Number(number) >= 0) {
      const valueFormat = event?.target.value.replace(/,/g, '.');

      if (
        valueFormat.length > 1 &&
        valueFormat[1] !== '.' &&
        Number(valueFormat) === 0
      ) {
        setVal('0');
        return;
      }

      if (Number(valueFormat) > Number(userInfo?.availableNumber)) {
        setVal(val);
        return;
      }

      const lstValueFormat = valueFormat?.toString().split('.');
      if (lstValueFormat.length > 1) {
        const result = `${lstValueFormat[0]}.${lstValueFormat[1]?.slice(
          0,
          DECIMALS_INPUT
        )}`;
        setVal(result);
        return;
      }
      setVal(valueFormat);
    }
  };
  const handleChangeValueUnstake = event => {
    enforcerUnStake(event.target.value.replace(/,/g, '.'));
    const numberDigitsRegex = /^\d*(\.\d{0,18})?$/g;
    if (!numberDigitsRegex.test(event.target.value)) {
      return;
    }
    setMessErrUnStake({
      mess: '',
      show: false
    });
    const number = event.target.value;
    setIsMaxValueUnStake(false);
    if (number === '') {
      setMessErrUnStake({
        mess: '',
        show: false
      });
    }
    if (number !== '' && Number(number) === 0) {
      setMessErrUnStake({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
      setDisabledBtnUn(true);
    } else {
      setMessErrUnStake({
        mess: '',
        show: false
      });
      setDisabledBtnUn(false);
    }
    if (number > +userInfo?.amountNumber) {
      setMessErrUnStake({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      setDisabledBtnUn(true);
    }
    if (number && !+userInfo?.amountNumber) {
      setMessErrUnStake({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      setDisabledBtnUn(true);
    }
    if (Number(number) < 0) {
      setValUnStake(0);
    } else if (Number(number) >= 0) {
      const valueFormat = event?.target.value.replace(/,/g, '.');

      if (
        valueFormat.length > 1 &&
        valueFormat[1] !== '.' &&
        Number(valueFormat) === 0
      ) {
        setValUnStake('0');
        return;
      }

      if (Number(valueFormat) > Number(userInfo?.amountNumber)) {
        setValUnStake(valUnStake);
        return;
      }

      const lstValueFormat = valueFormat?.toString().split('.');
      if (lstValueFormat.length > 1) {
        const result = `${lstValueFormat[0]}.${lstValueFormat[1]?.slice(
          0,
          DECIMALS_INPUT
        )}`;
        setValUnStake(result);
        return;
      }
      setValUnStake(valueFormat);
    }
  };

  const handleMaxValue = () => {
    setIsMaxValue(true);
    const valueDecimals = renderValueDecimal(
      userInfo?.availableNumber,
      DECIMALS_LP
    );
    if (Number(valueDecimals) <= MIXIMUM_IPUT) {
      const value_miximum = showAllNumber(valueDecimals);
      setVal(value_miximum);
    }
    if (valueDecimals < MINIMUM_VALUE) {
      setVal(0);
      setMessErr({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
    } else if (valueDecimals > MIXIMUM_IPUT) {
      const value = renderValueDecimal(
        userInfo?.availableNumber,
        DECIMALS_INPUT
      );
      setVal(value);
      setMessErr({
        mess: '',
        show: false
      });
    }
    if (
      userInfo?.availableNumber > 0 &&
      userInfo.availableNumber > MINIMUM_VALUE
    ) {
      setMessErr({
        mess: '',
        show: false
      });
    }
  };
  const handleMaxValueStaked = () => {
    setIsMaxValueUnStake(true);
    const valueDecimals = renderValueDecimal(
      userInfo?.amountNumber,
      DECIMALS_LP
    );
    if (Number(valueDecimals) <= MIXIMUM_IPUT) {
      const value_miximum = showAllNumber(valueDecimals);
      setValUnStake(value_miximum);
    }
    if (valueDecimals < MINIMUM_VALUE) {
      setValUnStake(0);
      setMessErrUnStake({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
    } else if (valueDecimals > MIXIMUM_IPUT) {
      const value = renderValueDecimal(userInfo?.amountNumber, DECIMALS_INPUT);
      setValUnStake(value);
      setMessErrUnStake({
        mess: '',
        show: false
      });
    }
    if (userInfo?.amountNumber > 0 && userInfo.amountNumber > MINIMUM_VALUE) {
      setMessErrUnStake({
        mess: '',
        show: false
      });
    }
  };
  // check approve lp
  const checkApproveLP = useCallback(async () => {
    if (!address) {
      setIsApproveLP(false);
      return;
    }
    await methods
      .call(lpContract.methods.allowance, [
        address,
        constants.CONTRACT_FARMING_ADDRESS
      ])
      .then(res => {
        const lpApproved = divDecimals(res, 18);
        if (lpApproved.isZero() || +val > lpApproved.toNumber()) {
          setIsApproveLP(false);
        } else {
          setIsApproveLP(true);
        }
      });
  }, [val, address, handleMaxValue, userInfo, handleMaxValueStaked, txhash]);
  const checkApproveNFT = useCallback(async () => {
    if (address) {
      await methods
        .call(nFtContract.methods.isApprovedForAll, [
          address,
          constants.CONTRACT_FARMING_ADDRESS
        ])
        .then(res => {
          setIsApproveNFT(res);
        });
    }
  }, [address, txhash, userInfo]);
  const checkApproveVstrk = useCallback(async () => {
    await methods
      .call(vStrkContract.methods.allowance, [
        address,
        constants.CONTRACT_FARMING_ADDRESS
      ])
      .then(res => {
        if (res) {
          const lpVstrkAprroved = divDecimals(res, 18);
          if (lpVstrkAprroved.isZero() || +val > lpVstrkAprroved.toNumber()) {
            setIsAprroveVstrk(false);
          } else {
            setIsAprroveVstrk(true);
          }
        }
      });
  }, [val, handleMaxValue, handleMaxValueStaked, address, userInfo, txhash]);
  // approved Lp
  const handleApproveLp = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
        instance,
        lpContract.methods.approve,
        [constants.CONTRACT_FARMING_ADDRESS, MAX_APPROVE],
        address
      )
      .then(res => {
        if (res) {
          if (res) {
            setiIsConfirm(false);
            setTxhash(res.transactionHash);
          }
        }
      })
      .catch(err => {
        if (err.code === 4001 || err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline_transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Something_went_wrong');
        }
        throw err;
      });
  }, [address]);

  const handleApproveVstrk = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
        instance,
        vStrkContract.methods.approve,
        [constants.CONTRACT_FARMING_ADDRESS, MAX_APPROVE],
        address
      )
      .then(res => {
        if (res) {
          if (res) {
            setiIsConfirm(false);
            setTxhash(res.transactionHash);
          }
        }
      })
      .catch(err => {
        if (err.code === 4001 || err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline_transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Something_went_wrong');
        }
        throw err;
      });
  }, [address]);

  const handleApproveNFT = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
        instance,
        nFtContract.methods.setApprovalForAll,
        [constants.CONTRACT_FARMING_ADDRESS, true],
        address
      )
      .then(res => {
        if (res) {
          if (res) {
            setiIsConfirm(false);
            setTxhash(res.transactionHash);
          }
        }
      })
      .catch(err => {
        if (err.code === 4001 || err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline_transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Something_went_wrong');
        }
        throw err;
      });
  }, [address]);

  // stake
  const handleStake = async () => {
    if (val > +userInfo?.availableNumber) {
      setMessErr({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      return;
    }
    if (!val || val === 0) {
      setMessErr({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
    } else {
      // deposit
      setiIsConfirm(true);
      setIsLoadingBtn(true);
      const valueMaxStake = divDecimalsBigNumber(
        userInfo.availableMax,
        userInfo.decimalLp
      );
      const valueBigNumber = isMaxValue
        ? new BigNumber(valueMaxStake)
        : new BigNumber(val);
      if (valueBigNumber.isZero()) {
        setMessErr({
          mess: <FormattedMessage id="Invalid_amount" />,
          show: true
        });
        setiIsConfirm(false);
        return;
      }

      await methods
        .send(
          instance,
          farmingContract.methods.deposit,
          [
            0,
            valueBigNumber
              .times(new BigNumber(10).pow(18))
              .integerValue()
              .toString(10)
          ],
          address
        )
        .then(res => {
          if (res) {
            setTxhash(res.transactionHash);
            setTextSuccess(
              <FormattedMessage id="Stake_STRK_ETH_successfully" />
            );
            setiIsConfirm(false);
            setIsSuccess(true);
            setIsLoadingBtn(false);
            setIsMaxValue(false);
            setVal('');
          }
        })
        .catch(err => {
          if (err.code === 4001 || err.message.includes('User denied')) {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingBtn(false);
            setTextErr('Decline_transaction');
          } else {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingBtn(false);
            setTextErr('Something_went_wrong');
          }
          throw err;
        });

      setMessErr({
        mess: '',
        show: false
      });
    }
  };
  const handleUnStake = async () => {
    if (valUnStake > +userInfo?.amountNumber) {
      setMessErrUnStake({
        mess: <FormattedMessage id="The_amount_has_exceeded_balance" />,
        show: true
      });
      return;
    }
    if (!valUnStake || valUnStake === 0) {
      setMessErrUnStake({
        mess: <FormattedMessage id="Invalid_amount" />,
        show: true
      });
    } else {
      setMessErrUnStake({
        mess: '',
        show: true
      });
      // withdraw test
      setiIsConfirm(true);
      setIsLoadingUnStake(true);
      const valueMaxUnStake = divDecimalsBigNumber(
        userInfo.amountMax,
        userInfo.decimalLp
      );
      const valueBigNumber = isMaxValueUnStake
        ? new BigNumber(valueMaxUnStake)
        : new BigNumber(valUnStake);
      await methods
        .send(
          instance,
          farmingContract.methods.withdraw,
          [
            0,
            valueBigNumber
              .times(new BigNumber(10).pow(18))
              .integerValue()
              .toString(10)
          ],
          address
        )
        .then(res => {
          setTxhash(res.transactionHash);
          setTextSuccess(
            <FormattedMessage id="Unstake_STRK_ETH_successfully" />
          );
          setiIsConfirm(false);
          setIsSuccess(true);
          setIsLoadingUnStake(false);
          setIsMaxValueUnStake(false);
          setValUnStake('');
        })
        .catch(err => {
          if (err.code === 4001 || err.message.includes('User denied')) {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingUnStake(false);
            setTextErr('Decline_transaction');
          } else {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingUnStake(false);
            setTextErr('Something_went_wrong');
          }
          throw err;
        });
      setMessErrUnStake({
        mess: '',
        show: false
      });
    }
  };
  // handleClaim
  const handleClaimBaseReward = async () => {
    setiIsConfirm(true);
    const zero = 0;
    await methods
      .send(
        instance,
        farmingContract.methods.claimBaseRewards,
        [zero.toString(10)],
        address
      )
      .then(res => {
        if (res) {
          setTxhash(res.transactionHash);
          setiIsConfirm(false);
          setIsSuccess(true);
          setTextSuccess(
            <FormattedMessage id="Claim_Base_Reward_successfully" />
          );
        }
      })
      .catch(err => {
        if (err.code === 4001 || err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline_transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Something_went_wrong');
        }
        throw err;
      });
  };
  const handleClaimBootReward = async () => {
    setiIsConfirm(true);
    const zero = 0;
    await methods
      .send(
        instance,
        farmingContract.methods.claimBoostReward,
        [zero.toString(10)],
        address
      )
      .then(res => {
        if (res) {
          setTxhash(res.transactionHash);
          setiIsConfirm(false);
          setIsSuccess(true);
          setTextSuccess(
            <FormattedMessage id="Claim_Boost_Reward_successfully" />
          );
        }
      })
      .catch(err => {
        if (err.code === 4001 || err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline_transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Something_went_wrong');
        }
        throw err;
      });
  };
  const handleClaimPrimeReward = async () => {
    try {
      setiIsConfirm(true);
      const paramData = await restService({
        api: `/prime/claim`,
        method: 'POST',
        params: {
          address
        }
      });

      await methods
        .send(
          instance,
          primeRewardPoolContract.methods.claim,
          [
            paramData.data.data.user,
            paramData.data.data.amount,
            paramData.data.data.nonce,
            paramData.data.data.epochId,
            paramData.data.data.v,
            paramData.data.data.r,
            paramData.data.data.s
          ],
          address
        )
        .then(res => {
          if (res) {
            setRefresh(prevState => prevState + 1);
            setTxhash(res.transactionHash);
            setiIsConfirm(false);
            setIsSuccess(true);
            setTextSuccess(
              <FormattedMessage id="Claim_Prime_Reward_successfully" />
            );
          }
        })
        .catch(err => {
          if (err.code === 4001 || err.message.includes('User denied')) {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setTextErr('Decline_transaction');
          } else {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setTextErr('Something_went_wrong');
          }
          throw err;
        });
    } catch (error) {
      setIsShowCancel(true);
      setiIsConfirm(false);
      setTextErr('Something_went_wrong');
      throw error;
    }
  };

  // Stake NFT
  const handleStakeDialog = useCallback(
    async (value, event, checked, mess, lstAllIds) => {
      if (!value) {
        return;
      }
      if (!lstAllIds) {
        return;
      }
      if (mess) {
        return;
      }

      if (value && event.isTrusted) {
        setiIsConfirm(true);
        setIsStakeNFT(false);
        setIsDisableStakeNFTDialog(true);
        setMessConfirm('Do_not_close_popup_while');
        const lstAllIdsStake = _.map(lstAllIds, 'token_id');
        await methods
          .send(
            instance,
            checked
              ? farmingContract.methods.boostAll
              : farmingContract.methods.boost,
            [0, checked ? lstAllIdsStake : value.toString(10)],
            address
          )
          .then(res => {
            if (res) {
              setTxhash(res.transactionHash);
              setValueNFTStake('');
              setItemStaking([]);
              // begin time out
              setTimeout(async () => {
                await fetchNfts();
                await fetchStakedNfts();
                setiIsConfirm(false);
                setIsDisableStakeNFTDialog(false);
                setIsSuccess(true);
                setTextSuccess(
                  <FormattedMessage id="Stake_NFT_successfully" />
                );
                setMessConfirm('');
              }, TIME_UPDATE_NFT);
            }
          })
          .catch(err => {
            if (err.code === 4001 || err.message.includes('User denied')) {
              setIsShowCancel(true);
              setiIsConfirm(false);
              setIsDisableStakeNFTDialog(false);
              setTextErr('Decline_transaction');
              setValueNFTStake('');
              setMessConfirm('');
            } else {
              setIsShowCancel(true);
              setiIsConfirm(false);
              setIsDisableStakeNFTDialog(false);
              setTextErr('Something_went_wrong');
              setValueNFTStake('');
              setMessConfirm('');
            }
            throw err;
          });
      }
    },
    [dataNFT, address]
  );

  // unStake NFT
  const handleUnStakeDialog = useCallback(
    async (value, event, checked, mess) => {
      if (!value) {
        return;
      }
      if (mess) {
        return;
      }
      if (value && event.isTrusted) {
        setiIsConfirm(true);
        setIsUnStakeNFT(false);
        setIsDisableUnStakeNFTDialog(true);
        setMessConfirm('Do_not_close_popup_while');
        await methods
          .send(
            instance,
            checked
              ? farmingContract.methods.unBoostAll
              : farmingContract.methods.unBoost,
            checked ? [0] : [0, value.toString(10)],
            address
          )
          .then(res => {
            if (res) {
              setTxhash(res.transactionHash);
              setValueNFTUnStake('');
              setItemStaked([]);
              setTimeout(async () => {
                await fetchNfts();
                await fetchStakedNfts();
                setiIsConfirm(false);
                setIsDisableUnStakeNFTDialog(false);
                setTextSuccess(
                  <FormattedMessage id="Unstake_NFT_successfully" />
                );
                setMessConfirm('');
                setIsSuccess(true);
              }, TIME_UPDATE_NFT);
            }
          })
          .catch(err => {
            if (err.code === 4001 || err.message.includes('User denied')) {
              setValueNFTUnStake('');
              setIsShowCancel(true);
              setiIsConfirm(false);
              setIsDisableUnStakeNFTDialog(false);
              setTextErr('Decline_transaction');
              setMessConfirm('');
            } else {
              setValueNFTUnStake('');
              setIsShowCancel(true);
              setiIsConfirm(false);
              setIsDisableUnStakeNFTDialog(false);
              setTextErr('Something_went_wrong');
              setMessConfirm('');
            }
            throw err;
          });
      }
    },
    [dataNFTUnState, address]
  );
  // handleOpen
  const handleStakeNFT = () => {
    if (!userInfo.amountNumber) {
      return setIsStakeNFT(false);
    }
    setIsStakeNFT(true);
  };
  const handleUnStakeNFT = () => {
    if (isShowCountDownUnStakeNFT) {
      return setIsUnStakeNFT(false);
    }
    setIsUnStakeNFT(true);
  };
  // handle Close
  const handleCloseConfirm = () => {
    setiIsConfirm(false);
  };
  const handleCloseSuccess = () => {
    setIsSuccess(false);
  };
  const handleCloseErr = () => {
    setIsShowCancel(false);
  };
  const handleCloseUnStake = () => {
    setIsUnStakeNFT(false);
    setValueNFTUnStake('');
  };
  const handleCloseStake = () => {
    setIsStakeNFT(false);
    setValueNFTStake('');
  };
  // check approve lp
  useEffect(() => {
    if (address) {
      checkApproveLP();
      checkApproveNFT();
      checkApproveVstrk();
    }
  }, [
    val,
    handleMaxValue,
    handleMaxValueStaked,
    isApproveLP,
    txhash,
    dataNFTUnState
  ]);
  // change accounts
  useEffect(() => {
    const func = async () => {
      if (!address) {
        setYourBoostAPR(0);
        return;
      }
      const validNetwork = await checkIsValidNetwork(instance);
      if (validNetwork) {
        provider.on('accountsChanged', acc => {
          setSetting({
            selectedAddress: acc[0],
            accountLoading: true
          });
          setVal('');
          setValUnStake('');
          setMessErr({
            mess: '',
            show: false,
            noLP: false
          });
          setMessErrUnStake({
            mess: '',
            show: false
          });
          setIsStakeNFT(false);
          setIsUnStakeNFT(false);
        });
      }
    };
    func();
  }, [provider, address, instance]);
  // realtime base boost reward
  useEffect(() => {
    let updateTimerBaseBoost;
    // eslint-disable-next-line prefer-const
    updateTimerBaseBoost = setInterval(() => {
      getBaseBoostRealTime();
    }, 5000);
    return function cleanup() {
      abortController.abort();
      if (updateTimerBaseBoost) {
        clearInterval(updateTimerBaseBoost);
      }
    };
  });
  // check loadding nft
  useEffect(() => {
    // eslint-disable-next-line no-plusplus
    if (dataNFT.length > 0) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < dataNFT.length; i++) {
        fetch(dataNFT[i].img, { method: 'HEAD', mode: 'cors' })
          .then(res => {
            if (res.ok) {
              dataNFT[i].loaded = true;
            } else {
              dataNFT[i].loaded = false;
            }
          })
          .catch(err => {
            dataNFT[i].loaded = false;
          });
      }
    }
  }, [dataNFT]);
  // check loadding nft

  useEffect(() => {
    // eslint-disable-next-line no-plusplus
    if (dataNFTUnState.length > 0) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < dataNFTUnState.length; i++) {
        fetch(dataNFTUnState[i].img, { method: 'HEAD', mode: 'cors' })
          .then(res => {
            if (res.ok) {
              dataNFTUnState[i].loaded = true;
            } else {
              dataNFTUnState[i].loaded = false;
            }
          })
          .catch(err => {
            dataNFTUnState[i].loaded = false;
          });
      }
    }
  }, [dataNFTUnState]);
  return (
    <>
      <MainLayout>
        <ST.SMain>
          {/* <ST.SHr /> */}
          <Row className="all-section">
            <Col xs={{ span: 24 }} lg={{ span: 24 }}>
              <ST.SRewardInfo>
                <div className="info_part">
                  <div className="info">
                    <div className="label">
                      <FormattedMessage id="Staking_Point" />
                    </div>
                    <div className="value">{stakingPoint}</div>
                  </div>

                  <img src={dividerImg} className="divider" />

                  <div className="info">
                    <div className="label">
                      <FormattedMessage id="Estimated_Reward" />
                    </div>
                    <div className="value">${estimatedReward}</div>
                  </div>

                  <img src={dividerImg} className="divider" />

                  <div className="info">
                    <div className="label">
                      <FormattedMessage id="Prime_Reward_Pool" />
                    </div>
                    <div className="value">${totalReserveReward}</div>
                  </div>

                  <img src={dividerImg} className="divider" />

                  <div className="info">
                    <div className="label">
                      <FormattedMessage id="Prime_APR" />
                    </div>
                    <div className="value">{reservePrimeApy}%</div>
                  </div>
                </div>

                <div className="claim_part">
                  <img src={dividerImg} className="divider" />

                  <div className="info">
                    <div className="label">
                      <FormattedMessage id="Claimable_Reward" />
                    </div>
                    <div className="value">
                      ${numberFormat(claimableReward)}
                    </div>
                  </div>

                  <ST.SPrimeRewardClaim
                    disabled={!Number(claimableReward)}
                    onClick={handleClaimPrimeReward}
                  >
                    <FormattedMessage id="Claim" />
                  </ST.SPrimeRewardClaim>
                </div>
              </ST.SRewardInfo>

              <ST.SHr />

              <DashboardStaking
                instance={instance}
                amount={countNFT}
                txh={txhash}
              />
              <ST.SDivPadding>
                <ST.SHeader>
                  <ST.STextModel>
                    STRK-ETH <FormattedMessage id="Staking" />
                  </ST.STextModel>
                  <ST.SHref target="_blank" href={constants.SUPPORT_URL}>
                    <FormattedMessage id="Get" /> STRK-ETH LPs
                    <ST.SImgErr src={IconLinkBlue} />
                  </ST.SHref>
                </ST.SHeader>

                <Row>
                  <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        <ST.SInput>
                          <input
                            type="text"
                            value={val}
                            inputMode="decimal"
                            pattern="^[0-9]*[.,]?[0-9]*$"
                            min={0}
                            minLength={1}
                            spellCheck="false"
                            autoComplete="off"
                            autoCorrect="off"
                            maxLength={79}
                            placeholder={intl.formatMessage({
                              id: 'Enter_a_number'
                            })}
                            onChange={event => handleChangeValue(event)}
                            onBlur={event => {
                              if (event.target.value !== '') {
                                if (event.target.value < MINIMUM_VALUE_FORMAT) {
                                  setVal(event.target.value);
                                } else {
                                  setVal(Number(event.target.value));
                                }
                              } else {
                                replaceValue(event.target.value);
                              }
                            }}
                          />
                          <ST.SMax
                            disabled={
                              userInfo.availableNumber === 0 || !address
                            }
                            onClick={handleMaxValue}
                          >
                            <FormattedMessage id="MAX" />
                          </ST.SMax>
                        </ST.SInput>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        {messErr.show === true && (
                          <ST.SError>{messErr.mess}</ST.SError>
                        )}
                        {messErr?.noLP === true && (
                          <ST.SLinkErr
                            target="_blank"
                            href={constants.SUPPORT_URL}
                          >
                            {messErr.mess}
                            <ST.SLinkErr>
                              <ST.SImgErrNoMargin src={IconLink} />
                            </ST.SLinkErr>
                          </ST.SLinkErr>
                        )}
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        <ST.SInfor>
                          <ST.SInforText>
                            <FormattedMessage id="Available" />
                          </ST.SInforText>
                          {address ? (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              {userInfo.availableNumber > 0
                                ? userInfo.available
                                : '0.0'}
                            </ST.SInforValue>
                          ) : (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              -
                            </ST.SInforValue>
                          )}
                        </ST.SInfor>
                        <ST.SRowColumn>
                          {/* check approve lp */}
                          {address && isApproveLP && (
                            <>
                              {/* stake lp */}
                              <ST.SBoxUnState>
                                <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                                  <ST.SBtnUn>
                                    {!userInfo.available ||
                                    Number(userInfo.available) === 0 ? (
                                      <>
                                        <Col
                                          xs={{ span: 24 }}
                                          lg={{ span: 12 }}
                                        >
                                          <ST.SBtnUnStakeStart>
                                            <ST.SBtnStake disabled>
                                              <FormattedMessage id="Stake" />
                                            </ST.SBtnStake>
                                            <Tooltip
                                              placement="right"
                                              title={
                                                <FormattedMessage id="Countdown_Tooltip1" />
                                              }
                                            >
                                              <ST.SQuestion
                                                src={IconQuestion}
                                              />
                                            </Tooltip>
                                          </ST.SBtnUnStakeStart>
                                        </Col>
                                      </>
                                    ) : (
                                      <>
                                        {isLoadingBtn ? (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 12 }}
                                            >
                                              <ST.SBtnUnStakeStart>
                                                <ST.SBtnLoadding disabled>
                                                  <FormattedMessage id="Loading..." />
                                                </ST.SBtnLoadding>
                                                <Tooltip
                                                  placement="right"
                                                  title={
                                                    <FormattedMessage id="Countdown_Tooltip1" />
                                                  }
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStart>
                                            </Col>
                                          </>
                                        ) : (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 12 }}
                                            >
                                              <ST.SBtnUnStakeStart>
                                                <ST.SBtnStake
                                                  disabled={
                                                    disabledBtn ||
                                                    Number(val) === 0
                                                  }
                                                  onClick={handleStake}
                                                >
                                                  <FormattedMessage id="Stake" />
                                                </ST.SBtnStake>
                                                <Tooltip
                                                  placement="right"
                                                  title={
                                                    <FormattedMessage id="Countdown_Tooltip1" />
                                                  }
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStart>
                                            </Col>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </ST.SBtnUn>
                                </Col>
                              </ST.SBoxUnState>
                            </>
                          )}
                          {/* Approve */}
                          {address && !isApproveLP ? (
                            <>
                              <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                <ST.SBtn>
                                  <ST.SBtnApprove onClick={handleApproveLp}>
                                    <FormattedMessage id="Approve_Staking" />
                                  </ST.SBtnApprove>
                                </ST.SBtn>
                              </Col>
                            </>
                          ) : (
                            <>
                              <></>
                            </>
                          )}
                        </ST.SRowColumn>
                      </Col>
                    </Row>
                  </Col>
                  {/* Unstake */}
                  <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        <ST.SInputUnStake>
                          <input
                            type="text"
                            value={valUnStake}
                            inputMode="decimal"
                            pattern="^[0-9]*[.,]?[0-9]*$"
                            min={0}
                            minLength={1}
                            spellCheck="false"
                            autoComplete="off"
                            autoCorrect="off"
                            maxLength={79}
                            placeholder={intl.formatMessage({
                              id: 'Enter_a_number'
                            })}
                            onChange={event => handleChangeValueUnstake(event)}
                            onBlur={event => {
                              if (event.target.value !== '') {
                                if (event.target.value < MINIMUM_VALUE_FORMAT) {
                                  setValUnStake(event.target.value);
                                } else {
                                  setValUnStake(Number(event.target.value));
                                }
                              }
                              replaceValue(event.target.value);
                            }}
                          />
                          <ST.SMaxUn
                            disabled={userInfo.amountNumber === 0 || !address}
                            onClick={handleMaxValueStaked}
                          >
                            <FormattedMessage id="MAX" />
                          </ST.SMaxUn>
                        </ST.SInputUnStake>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        {messErrUnStake?.show === true && (
                          <ST.SErrorUn>{messErrUnStake.mess}</ST.SErrorUn>
                        )}
                        {messErrUnStake?.noLP === true && (
                          <ST.SLinkErrUn
                            target="_blank"
                            href={constants.SUPPORT_URL}
                          >
                            {messErrUnStake.mess}
                            <ST.SLinkErr>
                              <ST.SImgErr src={IconLink} />
                            </ST.SLinkErr>
                          </ST.SLinkErrUn>
                        )}
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        <ST.SInforNotBorder>
                          <ST.SInforTextUn>
                            <FormattedMessage id="Staked" />
                          </ST.SInforTextUn>
                          {address ? (
                            <ST.SInforValueUn>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              {userInfo.amountNumber > 0
                                ? userInfo.amount
                                : '0.0'}
                            </ST.SInforValueUn>
                          ) : (
                            <ST.SInforValueUn>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              -
                            </ST.SInforValueUn>
                          )}
                        </ST.SInforNotBorder>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                        {/* Unstake lp */}
                        <ST.SBoxUnState>
                          <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                            {address && isApproveLP && (
                              <>
                                {isUnStakeLp ? (
                                  <>
                                    {/* check appove nft */}
                                    {isAprroveVstrk ? (
                                      <>
                                        {isLoadingUnStake ? (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 24 }}
                                            >
                                              <ST.SBtnUnStakeStart>
                                                <ST.SBtnLoadding disabled>
                                                  <FormattedMessage id="Loading..." />
                                                </ST.SBtnLoadding>
                                                <Tooltip
                                                  placement="right"
                                                  title={
                                                    <FormattedMessage id="Countdown_Tooltip2" />
                                                  }
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStart>
                                            </Col>
                                          </>
                                        ) : (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 24 }}
                                            >
                                              <ST.SBtnUnStakeStartNotBorder>
                                                <ST.SBtnUnstake
                                                  className="mg-10"
                                                  disabled={
                                                    disabledBtnUn ||
                                                    Number(valUnStake) === 0
                                                  }
                                                  onClick={handleUnStake}
                                                >
                                                  <FormattedMessage id="Unstake" />
                                                </ST.SBtnUnstake>
                                                <Tooltip
                                                  placement="right"
                                                  title={
                                                    <FormattedMessage id="Countdown_Tooltip2" />
                                                  }
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStartNotBorder>
                                            </Col>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Col
                                          xs={{ span: 24 }}
                                          lg={{ span: 24 }}
                                        >
                                          <ST.SBtnUnStakeStartNotBorder>
                                            <ST.SBtnStake
                                              onClick={handleApproveVstrk}
                                            >
                                              <FormattedMessage id="Approve_Staking" />
                                            </ST.SBtnStake>
                                          </ST.SBtnUnStakeStartNotBorder>
                                        </Col>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                                      {expiryTimeUnstakeLP &&
                                      isShowCountDownUnStake &&
                                      userInfo.amountNumber > 0 &&
                                      address ? (
                                        <>
                                          <ST.SCountDown>
                                            <CountDownClaim
                                              times={expiryTimeUnstakeLP}
                                              address={address}
                                              txh={txhash}
                                              type={UNSTAKE}
                                              handleUnStake={handleUnStake}
                                              valUnStake={valUnStake}
                                              isAprroveVstrk={isAprroveVstrk}
                                              handleApproveVstrk={
                                                handleApproveVstrk
                                              }
                                              isShowCountDownUnStake={
                                                isShowCountDownUnStake
                                              }
                                            />
                                          </ST.SCountDown>
                                        </>
                                      ) : (
                                        <>
                                          {isAprroveVstrk ? (
                                            <ST.SBtnUnStakeStartNotBorder>
                                              <ST.SSUnTake
                                                className="mg-10"
                                                disabled={
                                                  isShowCountDownUnStake ||
                                                  !valUnStake
                                                }
                                                onClick={handleUnStake}
                                              >
                                                <FormattedMessage id="Unstake" />
                                              </ST.SSUnTake>
                                              <Tooltip
                                                placement="right"
                                                title={
                                                  <FormattedMessage id="Countdown_Tooltip2" />
                                                }
                                              >
                                                <ST.SQuestion
                                                  src={IconQuestion}
                                                />
                                              </Tooltip>
                                            </ST.SBtnUnStakeStartNotBorder>
                                          ) : (
                                            <>
                                              {!isLoading && (
                                                <ST.SBtnUnStakeStartNotBorder>
                                                  <ST.SBtnStake
                                                    onClick={handleApproveVstrk}
                                                  >
                                                    <FormattedMessage id="Approve_Staking" />
                                                  </ST.SBtnStake>
                                                </ST.SBtnUnStakeStartNotBorder>
                                              )}
                                            </>
                                          )}
                                        </>
                                      )}
                                    </Col>
                                  </>
                                )}
                              </>
                            )}
                          </Col>
                        </ST.SBoxUnState>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </ST.SDivPadding>
              <ST.SDivPaddingMT>
                <ST.SDivHarvest>
                  <ST.STextLeft>
                    <FormattedMessage id="Claim_the_Reward" />
                  </ST.STextLeft>
                  <ST.SInforTextVSTRK>
                    <ST.SInforTextVSTRKDetail>
                      STRK <FormattedMessage id="claimed" />
                    </ST.SInforTextVSTRKDetail>
                    {address ? (
                      <>
                        <ST.STotalClaim>
                          <ST.SIconSmall>
                            <ST.SImgLpSmall src={IconFlashSmall} />
                          </ST.SIconSmall>
                          {userInfo.totalClaim ?? '0.0'}
                        </ST.STotalClaim>
                      </>
                    ) : (
                      <>
                        <ST.STotalClaim>
                          <ST.SIconSmall>
                            <ST.SImgLpSmall src={IconFlashSmall} />
                          </ST.SIconSmall>
                          -
                        </ST.STotalClaim>
                      </>
                    )}
                  </ST.SInforTextVSTRK>
                </ST.SDivHarvest>
                {/* Base reward */}
                <ST.SBoxHarvest>
                  <Row>
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                      <ST.SInforClaimNotBorder>
                        <ST.SInforText>
                          <FormattedMessage id="Base_Reward" />
                        </ST.SInforText>
                        {address ? (
                          <ST.SInforValue>
                            <ST.SIconSmall>
                              <ST.SImgFlashSmall src={IconFlashSmall} />
                            </ST.SIconSmall>

                            {userInfo.accBaseReward ?? '0.0'}
                          </ST.SInforValue>
                        ) : (
                          <ST.SInforValue>
                            <ST.SIconSmall>
                              <ST.SImgFlashSmall src={IconFlashSmall} />
                            </ST.SIconSmall>
                            -
                          </ST.SInforValue>
                        )}
                      </ST.SInforClaimNotBorder>
                      {address && isApproveLP && !isShowCountDownClaimBase && (
                        <ST.SInforClaim>
                          <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                            <ST.SBtnClaim>
                              {isClaimBaseReward ? (
                                <ST.SClaim onClick={handleClaimBaseReward}>
                                  <FormattedMessage id="Claim" />
                                </ST.SClaim>
                              ) : (
                                <>
                                  <ST.SClaim
                                    disabled={
                                      isShowCountDownClaimBase ||
                                      Number(userInfo.accBaseReward) === 0
                                    }
                                    onClick={handleClaimBaseReward}
                                  >
                                    <FormattedMessage id="Claim" />
                                  </ST.SClaim>
                                </>
                              )}
                              <Tooltip
                                placement="right"
                                title={
                                  <FormattedMessage id="Countdown_Tooltip3" />
                                }
                              >
                                <ST.SQuestionClaim src={IconQuestion} />
                              </Tooltip>
                            </ST.SBtnClaim>
                          </Col>
                        </ST.SInforClaim>
                      )}

                      {expiryTimeBase &&
                      isShowCountDownClaimBase &&
                      userInfo.depositedDate > 0 &&
                      address &&
                      userInfo.accBaseReward &&
                      isApproveLP ? (
                        <ST.SInforClaim>
                          <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                            <ST.SCountDown>
                              <CountDownClaim
                                times={expiryTimeBase}
                                address={address}
                                type={CLAIMBASE}
                                handleClaimBaseReward={handleClaimBaseReward}
                                isClaimBaseReward={isClaimBaseReward}
                              />
                            </ST.SCountDown>
                          </Col>
                        </ST.SInforClaim>
                      ) : (
                        <></>
                      )}
                    </Col>

                    {/* Boost reward */}
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                      <Row>
                        <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                          <ST.SInforClaimNotBorder>
                            <ST.SInforTextMargin>
                              <FormattedMessage id="Boost_Reward" />
                            </ST.SInforTextMargin>
                            {address ? (
                              <ST.SInforValueNoMargin>
                                <ST.SIconSmall>
                                  <ST.SImgFlashSmall src={IconFlashSmall} />
                                </ST.SIconSmall>
                                {userInfo.accBoostReward ?? '0.0'}
                              </ST.SInforValueNoMargin>
                            ) : (
                              <ST.SInforValueNoMargin>
                                <ST.SIconSmall>
                                  <ST.SImgFlashSmall src={IconFlashSmall} />
                                </ST.SIconSmall>
                                -
                              </ST.SInforValueNoMargin>
                            )}
                          </ST.SInforClaimNotBorder>
                          {address &&
                            isApproveLP &&
                            !isShowCountDownClaimBoost && (
                              <ST.SInforClaimNotBorder>
                                <ST.SBoxState>
                                  <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                                    <ST.SBtnClaimStart>
                                      {isClaimBootReward ? (
                                        <ST.SClaim
                                          onClick={handleClaimBootReward}
                                        >
                                          <FormattedMessage id="Claim" />
                                        </ST.SClaim>
                                      ) : (
                                        <ST.SClaim
                                          disabled={
                                            isShowCountDownClaimBoost ||
                                            Number(userInfo.accBoostReward) ===
                                              0
                                          }
                                          onClick={handleClaimBootReward}
                                        >
                                          <FormattedMessage id="Claim" />
                                        </ST.SClaim>
                                      )}
                                      <Tooltip
                                        placement="right"
                                        title={
                                          <FormattedMessage id="Countdown_Tooltip4" />
                                        }
                                      >
                                        <ST.SQuestion src={IconQuestion} />
                                      </Tooltip>
                                    </ST.SBtnClaimStart>
                                  </Col>
                                </ST.SBoxState>
                              </ST.SInforClaimNotBorder>
                            )}
                          {expiryTimeBoost &&
                          isShowCountDownClaimBoost &&
                          userInfo.boostedDate > 0 &&
                          address &&
                          userInfo.accBoostReward &&
                          isApproveLP ? (
                            <ST.SInforClaimCountDown>
                              <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                                <ST.SCountDown>
                                  <CountDownClaim
                                    times={expiryTimeBoost}
                                    address={address}
                                    type={CLAIMBOOST}
                                    handleClaimBootReward={
                                      handleClaimBootReward
                                    }
                                    isClaimBootReward={isClaimBootReward}
                                  />
                                </ST.SCountDown>
                              </Col>
                            </ST.SInforClaimCountDown>
                          ) : (
                            <></>
                          )}
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </ST.SBoxHarvest>
              </ST.SDivPaddingMT>

              <ST.SDiv>
                <Row>
                  <ST.SRowFlex>
                    <ST.SFlex>
                      <ST.SText>
                        NFT <FormattedMessage id="Staking" />
                        <Tooltip
                          placement="right"
                          title={
                            <FormattedMessage id="Only_display_all_NFTs" />
                          }
                        >
                          <ST.SQuestion src={IconQuestion} />
                        </Tooltip>
                        <ST.SHrefNftWrapper>
                          <ST.SHrefGetNft
                            onClick={() => setIsOpenNftMintModal(true)}
                          >
                            <FormattedMessage id="Get_Strike_NFTs" />
                          </ST.SHrefGetNft>
                          {/* <ST.SHrefNft target="_blank" href={GET_NFT_URL}>
                            LooksRare
                            <img style={{ width: '14px' }} src={IconLinkBlue} />
                          </ST.SHrefNft> */}
                        </ST.SHrefNftWrapper>
                      </ST.SText>
                    </ST.SFlex>
                    {address ? (
                      <>
                        {isApproveNFT ? (
                          <>
                            <ST.SSTake
                              disabled={
                                itemStaking.length === MAX_STAKE_NFT ||
                                dataNFT.length === 0 ||
                                userInfo.amountNumber === 0 ||
                                isDisableStakeNFTDialog
                              }
                              onClick={handleStakeNFT}
                            >
                              <FormattedMessage id="Stake" />
                            </ST.SSTake>
                            <Tooltip
                              placement="top"
                              title={
                                <FormattedMessage id="MustStake_Tooltip" />
                              }
                            >
                              <ST.SQuestionNFT src={IconQuestion} />
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <ST.SSTake onClick={handleApproveNFT}>
                              <FormattedMessage id="Approve_Staking" />
                            </ST.SSTake>
                          </>
                        )}
                      </>
                    ) : (
                      <> </>
                    )}
                  </ST.SRowFlex>
                </Row>
                {isLoading ? (
                  <Row>
                    <Loadding />
                  </Row>
                ) : (
                  <>
                    <ST.SSlider>
                      {dataNFT.length === 0 && (
                        <ST.SSliderNoData>
                          <ST.SSliderNoDataImg src={IconNoData} />
                          <ST.SSliderNoDataText>
                            {address ? (
                              <FormattedMessage id="You_do_not_own_any_NFTs" />
                            ) : (
                              <FormattedMessage id="Connect_wallet_to_see_your_NFTs" />
                            )}
                          </ST.SSliderNoDataText>
                        </ST.SSliderNoData>
                      )}

                      <Slider {...AUDITOR_SETTING}>
                        {dataNFT &&
                          dataNFT?.map(item => {
                            return (
                              <ST.SItemSlider key={item.id}>
                                {item.loaded ? (
                                  <>
                                    <ST.SImgSlider
                                      src={item.img}
                                      alt={item.name}
                                    />
                                  </>
                                ) : (
                                  <ST.SLoadingNFT>
                                    <Loadding />
                                  </ST.SLoadingNFT>
                                )}
                                <ST.SBoxSlider>
                                  <ST.STitleSlider>{item.name}</ST.STitleSlider>
                                  <ST.SDescriptionSlider>
                                    {item.description}
                                  </ST.SDescriptionSlider>
                                </ST.SBoxSlider>
                              </ST.SItemSlider>
                            );
                          })}
                      </Slider>
                    </ST.SSlider>
                  </>
                )}
              </ST.SDiv>
              <ST.SDiv>
                <Row>
                  <ST.SRowFlexNFTStaking>
                    <ST.SWrapperNFTStake>
                      <ST.SWrapperTitle>
                        <ST.SFlex>
                          <ST.SText>
                            NFT <FormattedMessage id="Staked" />
                          </ST.SText>
                        </ST.SFlex>

                        {yourBoostAPR &&
                        yourBoostAPR !== 0 &&
                        dataNFTUnState.length > 0 ? (
                          <ST.SDetailsColor>
                            {' '}
                            <FormattedMessage id="Your_Boost_APR" />:
                            <ST.SDetailsColorBold>
                              {yourBoostAPR}%{' '}
                            </ST.SDetailsColorBold>
                          </ST.SDetailsColor>
                        ) : (
                          <ST.SDetailsColor>
                            <FormattedMessage id="Your_Boost_APR" />:{' '}
                            <ST.SDetailsColorNotBold>-</ST.SDetailsColorNotBold>
                          </ST.SDetailsColor>
                        )}
                      </ST.SWrapperTitle>

                      <ST.SUnstakeCountDownWeb>
                        {address && (
                          <ST.SFlexEnd>
                            {expiryTimeUnstakeNFT &&
                            isShowCountDownUnStakeNFT &&
                            dataNFTUnState.length > 0 &&
                            isApproveNFT ? (
                              <ST.SWrapperCountDownWeb>
                                <CountDownClaim
                                  times={expiryTimeUnstakeNFT}
                                  address={address}
                                  type={UNSTAKENFT}
                                  handleUnStakeNFT={handleUnStakeNFT}
                                />
                              </ST.SWrapperCountDownWeb>
                            ) : (
                              <>
                                <ST.SSUnSTakedWeb
                                  disabled={
                                    dataNFTUnState.length === 0 ||
                                    isDisableUnStakeNFTDialog
                                  }
                                  onClick={handleUnStakeNFT}
                                >
                                  <FormattedMessage id="Unstake" />
                                </ST.SSUnSTakedWeb>
                              </>
                            )}
                          </ST.SFlexEnd>
                        )}
                      </ST.SUnstakeCountDownWeb>

                      {address && (
                        <>
                          {expiryTimeUnstakeNFT &&
                          isShowCountDownUnStakeNFT &&
                          dataNFTUnState.length > 0 &&
                          isApproveNFT ? (
                            <ST.SWrapperCountDownMobile>
                              <CountDownClaim
                                times={expiryTimeUnstakeLP}
                                address={address}
                                type={UNSTAKENFT}
                                handleUnStakeNFT={handleUnStakeNFT}
                              />
                            </ST.SWrapperCountDownMobile>
                          ) : (
                            <ST.SWrapperUnStake>
                              <ST.SSUnSTakedMobile
                                disabled={dataNFTUnState.length === 0}
                                onClick={handleUnStakeNFT}
                              >
                                <FormattedMessage id="Unstake" />
                              </ST.SSUnSTakedMobile>
                            </ST.SWrapperUnStake>
                          )}
                        </>
                      )}
                    </ST.SWrapperNFTStake>
                  </ST.SRowFlexNFTStaking>
                </Row>

                {isLoading ? (
                  <Row>
                    <Loadding />
                  </Row>
                ) : (
                  <>
                    <ST.SSlider>
                      {dataNFTUnState.length === 0 && (
                        <ST.SSliderNoData>
                          <ST.SSliderNoDataImg src={IconNoData} />
                          <ST.SSliderNoDataText>
                            {address ? (
                              <FormattedMessage id="You_do_not_own_any_NFTs" />
                            ) : (
                              <FormattedMessage id="Connect_wallet_to_see_your_NFTs" />
                            )}
                          </ST.SSliderNoDataText>
                        </ST.SSliderNoData>
                      )}
                      <Slider {...AUDITOR_SETTING}>
                        {dataNFTUnState &&
                          dataNFTUnState?.map(item => {
                            return (
                              <ST.SItemSlider key={item.id}>
                                {item.loaded ? (
                                  <>
                                    <ST.SImgSlider
                                      src={item.img}
                                      alt={item.name}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <ST.SLoadingNFT>
                                      <Loadding />
                                    </ST.SLoadingNFT>
                                  </>
                                )}
                                <ST.SBoxSlider>
                                  <ST.STitleSlider>{item.name}</ST.STitleSlider>
                                  <ST.SDescriptionSlider>
                                    {item.description}
                                  </ST.SDescriptionSlider>
                                </ST.SBoxSlider>
                              </ST.SItemSlider>
                            );
                          })}
                      </Slider>
                    </ST.SSlider>
                  </>
                )}
              </ST.SDiv>
            </Col>
          </Row>
        </ST.SMain>
      </MainLayout>
      {/* Stake */}
      <DialogStake
        isStakeNFT={isStakeNFT}
        close={handleCloseStake}
        itemStaking={itemStaking}
        listStake={dataNFT}
        listUnStake={dataNFTUnState}
        valueNFTStake={valueNFTStake}
        currentNFT={countNFT}
        handleStakeDialog={handleStakeDialog}
        address={address}
      />

      {/* UnStake */}
      <DialogUnStake
        isUnStakeNFT={isUnStakeNFT}
        close={handleCloseUnStake}
        itemStaked={itemStaked}
        list={dataNFTUnState}
        valueNFTUnStake={valueNFTUnStake}
        currentNFT={countNFT}
        handleUnStakeDialog={handleUnStakeDialog}
        address={address}
      />
      {/* err */}
      <DialogErr isShow={isShowCancel} close={handleCloseErr} text={textErr} />
      {/* Confirm */}
      <DialogConfirm
        isConfirm={isConfirm}
        close={handleCloseConfirm}
        messConfirm={messConfirm}
      />
      {isSuccess && (
        <DialogSuccess
          isSuccess={isSuccess}
          close={handleCloseSuccess}
          address={settings?.selectedAddress}
          text={textSuccess}
          txh={txhash}
          // isDisabledSuccess={isDisabledSuccess}
          // timeDelay={timeDelay}
        />
      )}
      {isOpenNftMintModal && (
        <NftMintModal
          visible={isOpenNftMintModal}
          onCancel={() => setIsOpenNftMintModal(false)}
        />
      )}
    </>
  );
}
Staking.propTypes = {
  settings: PropTypes.object,
  setSetting: PropTypes.func.isRequired,
  intl: intlShape.isRequired
};

Staking.defaultProps = {
  settings: {}
};

const mapStateToProps = ({ account }) => ({
  settings: account.setting
});

const mapDispatchToProps = dispatch => {
  const { setSetting, getVoterAccounts } = accountActionCreators;

  return bindActionCreators(
    {
      setSetting,
      getVoterAccounts
    },
    dispatch
  );
};

export default injectIntl(
  compose(
    withRouter,
    connectAccount(mapStateToProps, mapDispatchToProps)
  )(Staking)
);
