/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-concat */
/* eslint-disable no-sequences */
/* eslint-disable import/no-duplicates */
/* eslint-disable no-self-compare */
/* eslint-disable no-const-assign */
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Slider from 'react-slick';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { bindActionCreators } from 'redux';
import MainLayout from 'containers/Layout/MainLayout';
import { Row, Col, Tooltip } from 'antd';
import { connectAccount, accountActionCreators } from 'core';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import _ from 'lodash';
import * as constants from 'utilities/constants';
// import { checkIsValidNetwork } from 'utilities/common';
import {
  divDecimals,
  renderValueFixed,
  MAX_APPROVE,
  SECOND24H,
  SECOND2DAY,
  SECOND30DAY,
  PERCENT_APR,
  MAX_STAKE_NFT
} from './helper';
// eslint-disable-next-line import/named
import { axiosInstanceMoralis } from '../../../utilities/axios';
import '../../../assets/styles/slick.scss';
import * as ST from '../../../assets/styles/staking.js';
// eslint-disable-next-line import/no-duplicates
import DialogConfirm from './DialogConfirm';
import DialogErr from './DialogErr';
import {
  getFarmingContract,
  getLPContract,
  getVSTRKContract,
  getNFTContract,
  methods
} from '../../../utilities/ContractService';
import DashboardStaking from './Dashboard';
import CountDownClaim from './countDownClaim';
import DialogSuccess from './DialogSuccess';
import DialogUnStake from './DialogUnStake';
import DialogStake from './DialogStake';
// eslint-disable-next-line import/no-named-as-default
import Loadding from './Loadding';
// eslint-disable-next-line import/order
import IconQuestion from '../../../assets/img/error-outline.svg';
import IconDuck from '../../../assets/img/default_slider.svg';
import IconLink from '../../../assets/img/launch.svg';
import IconLinkBlue from '../../../assets/img/link_blue.svg';
import IconNoData from '../../../assets/img/no_data.svg';
import IConNext from '../../../assets/img/arrow-next.svg';
import IConPrev from '../../../assets/img/arrow-prev.svg';
import IconFlashSmall from '../../../assets/img/flash_small.svg';
import IconLpSmall from '../../../assets/img/lp_small.svg';
import IconVstrkSmall from '../../../assets/img/flash_vstrk.svg';
// import IconSelect from '../../../assets/img/select.svg';
// import IconNotSelect from '../../../assets/img/not_select.svg';
// import IconNotConnect from '../../../assets/img/not_connect_data.svg';

// eslint-disable-next-line import/order
function SampleNextArrow(props) {
  // eslint-disable-next-line react/prop-types
  const { onClick } = props;
  return (
    <ST.SNexSlider
      src={IConNext}
      className="slick-arrow slick-next"
      onClick={onClick}
    />
  );
}
function SamplePrevArrow(props) {
  // eslint-disable-next-line react/prop-types
  const { onClick } = props;
  return (
    <ST.SPrevSlider
      src={IConPrev}
      className="slick-arrow slick-prev"
      onClick={onClick}
    />
  );
}
const AUDITOR_SETTING = {
  dots: false,
  infinite: false,
  loop: false,
  autoplay: false,
  speed: 2000,
  autoplaySpeed: 2000,
  slidesToShow: 4,
  slidesToScroll: 4,
  initialSlide: 0,
  nextArrow: <SampleNextArrow />,
  prevArrow: <SamplePrevArrow />,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: true,
        dots: true
      }
    },
    {
      breakpoint: 820,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
        initialSlide: 0,
        dots: false,
        infinite: false,
        loop: false,
        autoplay: false
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 8,
        slidesToScroll: 1,
        initialSlide: 0,
        dots: false,
        infinite: false,
        loop: false,
        autoplay: false
      }
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
        dots: false,
        infinite: false,
        loop: false,
        autoplay: false
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        initialSlide: 0,
        dots: false,
        infinite: false,
        loop: false,
        autoplay: false
      }
    }
  ]
};
// eslint-disable-next-line react/prop-types
function Staking({ settings, setSetting }) {
  const address = settings.selectedAddress;
  const [val, setVal] = useState('');
  const [messErr, setMessErr] = useState({
    mess: '',
    show: false,
    noLP: false
  });
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
  const [isApproveLP, setIsApproveLP] = useState(true);
  const [isApproveNFT, setIsApproveNFT] = useState(false);
  const [isAprroveVstrk, setIsAprroveVstrk] = useState(false);
  const [isClaimBaseReward, setisClaimBaseReward] = useState(false);
  const [isClaimBootReward, setIsClaimBootReward] = useState(false);
  const [disabledBtn, setDisabledBtn] = useState(false);
  const [disabledBtnUn, setDisabledBtnUn] = useState(false);
  const [countNFT, setCounNFT] = useState(0);
  const [isUnStakeLp, setIsUnStakeLp] = useState(false);
  const [itemStaking, setItemStaking] = useState([]);
  const [itemStaked, setItemStaked] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [yourBoostAPR, setYourBoostAPR] = useState(0);
  const [valueNFTStake, setValueNFTStake] = useState('');
  const [valueNFTUnStake, setValueNFTUnStake] = useState('');
  // contract
  const farmingContract = getFarmingContract();
  const lpContract = getLPContract();
  const vStrkContract = getVSTRKContract();
  const nFtContract = getNFTContract();
  // get userInfor
  useMemo(async () => {
    window.web3 = new Web3(window.ethereum);
    let sTokenBalance = null;
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
          const balanceBigNumber = divDecimals(sTokenBalance, 18);
          const pendingAmountNumber = divDecimals(res.pendingAmount, 18);
          const amountNumber = divDecimals(res.amount, 18);
          const totalAmount = amountNumber.plus(pendingAmountNumber);
          const totalAmountNumber = totalAmount.toNumber();
          const accBaseRewardBigNumber = divDecimals(
            objClaim.accBaseReward,
            18
          );
          const accBoostRewardBigNumber = divDecimals(
            objClaim.accBoostReward,
            18
          );
          const amountString = amountNumber?.toNumber();
          const accBaseRewardString = accBaseRewardBigNumber.toNumber();
          const accBoostRewardString = accBoostRewardBigNumber.toNumber();
          const balanceBigFormat = balanceBigNumber
            .toNumber()
            .toFixed(4)
            .toString();
          if (balanceBigNumber.isZero()) {
            setMessErr({
              mess: 'No tokens to stake: Get STRK-ETH LP',
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
          const currentTime = Math.floor(new Date().getTime() / 1000);
          const timeBaseUnstake = +res.depositedDate;
          const timeBootsUnstake = +res.boostedDate;
          const overTimeBaseReward = currentTime - timeBaseUnstake;
          const overTimeBootReward = currentTime - timeBootsUnstake;

          if (timeBaseUnstake === 0) {
            setisClaimBaseReward(false);
            setIsUnStakeLp(false);
          } else {
            setisClaimBaseReward(overTimeBaseReward >= SECOND24H);
            setIsUnStakeLp(overTimeBaseReward >= SECOND2DAY);
          }
          if (timeBootsUnstake === 0) {
            setIsClaimBootReward(false);
          } else {
            setIsClaimBootReward(overTimeBootReward >= SECOND30DAY);
          }
          objUser = {
            ...res,
            amount:
              amountString !== 0 && amountString < 0.001
                ? '<0.001'
                : renderValueFixed(totalAmount).toString(),
            amountNumber: totalAmountNumber,
            available: renderValueFixed(balanceBigFormat).toString(),
            availableNumber: balanceBigNumber.toNumber(),
            accBaseReward:
              accBaseRewardString !== 0 && accBaseRewardString < 0.001
                ? '<0.001'
                : renderValueFixed(accBaseRewardString),
            accBoostReward:
              accBoostRewardString !== 0 && accBoostRewardString < 0.001
                ? '<0.001'
                : renderValueFixed(accBoostRewardString),
            depositedDate: timeBaseUnstake,
            boostedDate: timeBootsUnstake
          };
        })
        .catch(err => {
          throw err;
        });
      await methods
        .call(vStrkContract.methods.balanceOf, [address])
        .then(res => {
          const vStrkString = divDecimals(res, 18);
          if (vStrkString < 0.001) {
            setUserInfo({ ...objUser, vStrk: '< 0.001' });
          }
          setUserInfo({ ...objUser, vStrk: renderValueFixed(vStrkString) });
        })
        .catch(err => {
          throw err;
        });
    }
  }, [address, txhash]);
  // get data
  useMemo(async () => {
    if (!address) {
      setIsLoading(false);
      setDataNFT([]);
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstanceMoralis
        .get(`/${address}/nft?chain=rinkeby&format=decimal&limit=20`)
        .then(res => {
          const data = res.data.result;
          if (data && data.length > 0) {
            const dataMyContract = _.filter(data, item => {
              return item.token_address === constants.NFT_ADDRESS.toLowerCase();
            });
            // eslint-disable-next-line no-shadow
            const dataConvert = _.cloneDeep(dataMyContract);
            // eslint-disable-next-line array-callback-return
            dataConvert.map(item => {
              item.active = false;
              //
              item.name = `${item.name}${' #'}${item.token_id}`;
              item.id = +item.token_id;
              item.metadata = JSON.parse(item.metadata);
              if (item?.metadata?.image) {
                item.img = item?.metadata?.image;
              } else {
                item.img = IconDuck;
              }
            });
            const dataStakeClone = _.cloneDeep(dataConvert);
            const dataStakeCloneSort = _.sortBy(dataStakeClone, 'id');
            setDataNFT(dataStakeCloneSort);
            setIsLoading(false);
          } else {
            setDataNFT([]);
          }
          setIsLoading(false);
        });
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [address, txhash, window.ethereum]);

  useMemo(async () => {
    if (!address) {
      setIsLoading(false);
      setDataNFTUnState([]);
      return;
    }
    setIsLoading(true);
    try {
      await methods
        .call(farmingContract.methods.getUserInfo, [0, address])
        .then(res => {
          if (res && res.boostFactors.length > 0) {
            const lstStakedId = res.boostFactors;
            const dataCovert = [...lstStakedId];
            setCounNFT(dataCovert.length);
            const newArray = dataCovert?.map(item => {
              // eslint-disable-next-line no-return-assign
              return (item = {
                name: 'AnnexIronWolf ' + `#${item}`,
                token_id: item,
                id: +item,
                img: IconDuck,
                active: false
              });
            });
            const lengthArr = newArray.length;
            if (lengthArr === 0 || lengthArr === 1) {
              setYourBoostAPR(0);
            } else {
              const yourBoostAPRPer = PERCENT_APR * lengthArr;
              setYourBoostAPR(yourBoostAPRPer);
            }
            const newArraySort = _.sortBy(newArray, 'id');
            setDataNFTUnState(newArraySort);
            setIsLoading(false);
          } else {
            setDataNFTUnState([]);
          }
        });
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  }, [address, txhash, window.ethereum]);
  // change amount
  const enforcer = nextUserInput => {
    const numberDigitsRegex = /^\d*(\.\d{0,18})?$/g;
    if (nextUserInput === '' || numberDigitsRegex.test(nextUserInput)) {
      setVal(nextUserInput);
    }
  };

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
    if (/^0/.test(val)) {
      const valueZero = val.replace(/^0/, '');
      setVal(valueZero);
      setMessErr({
        mess: 'Invalid amount',
        show: true
      });
    }
    if (number === '0') {
      setMessErr({
        mess: 'Invalid amount',
        show: true
      });
      setDisabledBtn(true);
      setDisabledBtnUn(true);
    } else {
      setMessErr({
        mess: '',
        show: false
      });
      setDisabledBtn(false);
      setDisabledBtnUn(false);
    }

    // if (Number(number) > 0 && Number(number) > +userInfo?.available) {
    //   setDisabledBtn(true);
    //   setMessErr({
    //     mess: 'The amount has exceeded your balance. Try again!',
    //     show: true
    //   });
    // } else {
    //   setDisabledBtn(false);
    // }
    if (Number(number) < 0) {
      setVal(0);
    } else if (Number(number) > 0) {
      const valueFormat = event?.target.value.replace(/,/g, '.');
      const lstValueFormat = valueFormat?.toString().split('.');
      if (lstValueFormat.length > 1) {
        const result = `${lstValueFormat[0]}.${lstValueFormat[1]?.slice(0, 5)}`;
        setVal(result);
        return;
      }
      setVal(valueFormat);
    }
  };
  const handleMaxValue = () => {
    setVal(userInfo?.availableNumber);
    if (userInfo?.availableNumber > 0) {
      setMessErr({
        mess: '',
        show: false
      });
    }
  };
  const handleMaxValueStaked = () => {
    setVal(userInfo?.amountNumber);
    if (userInfo?.amountNumber > 0) {
      setMessErr({
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
    if (Number(userInfo.available) === 0) {
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
        if (messErr.show || messErr.noLP) {
          setIsApproveLP(true);
        }
        if (lpApproved.isZero() || +val > lpApproved.toNumber()) {
          setIsApproveLP(false);
        } else {
          setIsApproveLP(true);
        }
      });
  }, [val, address, handleMaxValue, userInfo, handleMaxValueStaked]);
  const checkApproveNFT = useCallback(async () => {
    await methods
      .call(nFtContract.methods.isApprovedForAll, [
        address,
        constants.CONTRACT_FARMING_ADDRESS
      ])
      .then(res => {
        if (res) {
          setIsApproveNFT(res);
        }
      });
  }, [address]);
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
  }, [val, handleMaxValue, handleMaxValueStaked, address, userInfo]);
  // approved Lp
  const handleApproveLp = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
        lpContract.methods.approve,
        [constants.CONTRACT_FARMING_ADDRESS, MAX_APPROVE],
        address
      )
      .then(res => {
        if (res) {
          setiIsConfirm(false);
          setTxhash(res.transactionHash);
        }
      })
      .catch(err => {
        if (err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Some thing went wrong!');
        }
        throw err;
      });
  }, [val, handleMaxValue, handleMaxValueStaked]);
  const handleApproveVstrk = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
        vStrkContract.methods.approve,
        [constants.CONTRACT_FARMING_ADDRESS, MAX_APPROVE],
        address
      )
      .then(res => {
        if (res) {
          setiIsConfirm(false);
          setTxhash(res.transactionHash);
        }
      })
      .catch(err => {
        if (err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Some thing went wrong!');
        }
        throw err;
      });
  }, [val, handleMaxValue, handleMaxValueStaked]);
  // check approve lp
  useEffect(() => {
    checkApproveLP();
    checkApproveNFT();
    checkApproveVstrk();
  }, [
    val,
    handleMaxValue,
    handleMaxValueStaked,
    isApproveLP,
    txhash,
    dataNFTUnState
  ]);
  const handleApproveNFT = useCallback(async () => {
    setiIsConfirm(true);
    await methods
      .send(
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
        if (err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Some thing went wrong!');
        }
        throw err;
      });
  }, []);

  const expiryTimeUnstakeLP = useMemo(() => {
    const overOneDate = new Date(userInfo.depositedDate * 1000);
    return overOneDate.setMinutes(overOneDate.getMinutes() + 20); // 20 minute
    // return overOneDate.setDate(overOneDate.getDate() + 2); // 1 dâys
  }, [userInfo, address, txhash, isApproveLP]);
  console.log(expiryTimeUnstakeLP, 'expiryTimeUnstakeLP');
  // time claim base reward countdown
  const expiryTimeBase = useMemo(() => {
    if (userInfo) {
      const overOneDate = new Date(userInfo.depositedDate * 1000);
      return overOneDate.setMinutes(overOneDate.getMinutes() + 10); // 10 minute
      // return overOneDate.setDate(overOneDate.getDate() + 1); // 1 dâys
    }
  }, [userInfo, address, txhash, isApproveLP]);
  // time claim boost reward count down
  const expiryTimeBoost = useMemo(() => {
    if (userInfo) {
      const over30days = new Date(userInfo.boostedDate * 1000);
      return over30days.setMinutes(over30days.getMinutes() + 30); // 30 minute
      // return over30days.setDate(over30days.getDate() + 30); // 30 days
    }
  }, [userInfo, address, txhash, isApproveLP]);

  // stake
  const handleStake = async () => {
    if (val > +userInfo?.available) {
      setMessErr({
        mess: 'The amount has exceeded your balance. Try again!',
        show: true
      });
      return;
    }
    if (!val || val === 0) {
      setMessErr({
        mess: 'Invalid amount',
        show: true
      });
    } else {
      // deposit
      setiIsConfirm(true);
      setIsLoadingBtn(true);
      const valueBigNumber = new BigNumber(val);
      if (valueBigNumber.isZero()) {
        setMessErr({
          mess: 'Invalid amount',
          show: true
        });
        setiIsConfirm(false);
        return;
      }
      await methods
        .send(
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
            setTextSuccess('Stake STRK-ETH successfully');
            setiIsConfirm(false);
            setIsSuccess(true);
            setIsLoadingBtn(false);
            setVal('');
          }
        })
        .catch(err => {
          if (err.message.includes('User denied')) {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingBtn(false);
            setTextErr('Decline transaction');
          } else {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingBtn(false);
            setTextErr('Some thing went wrong!');
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
    if (val > +userInfo?.amount) {
      setMessErr({
        mess: 'The amount has exceded your balance. Try again',
        show: true
      });
      return;
    }
    if (!val || val === 0) {
      setMessErr({
        mess: 'Invalid amount',
        show: true
      });
    } else {
      setMessErr({
        mess: '',
        show: true
      });
      // withdraw test
      setiIsConfirm(true);
      setIsLoadingUnStake(true);
      const valueBigNumber = new BigNumber(val);
      await methods
        .send(
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
          setTextSuccess('Unstake STRK-ETH successfully');
          setiIsConfirm(false);
          setIsSuccess(true);
          setIsLoadingUnStake(false);
        })
        .catch(err => {
          if (err.message.includes('User denied')) {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingUnStake(false);
            setTextErr('Decline transaction');
          } else {
            setIsShowCancel(true);
            setiIsConfirm(false);
            setIsLoadingUnStake(false);
            setTextErr('Some thing went wrong!');
          }
          throw err;
        });
      setMessErr({
        mess: '',
        show: false
      });
    }
  };
  // handleClaim
  const handleClainBaseReward = async () => {
    setiIsConfirm(true);
    const zero = 0;
    await methods
      .send(
        farmingContract.methods.claimBaseRewards,
        [zero.toString(10)],
        address
      )
      .then(res => {
        if (res) {
          setTxhash(res.transactionHash);
          setiIsConfirm(false);
          setIsSuccess(true);
          setTextSuccess('Claim Base Reward successfully');
        }
      })
      .catch(err => {
        if (err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Some thing went wrong!');
        }
        throw err;
      });
  };
  const handleClainBootReward = async () => {
    setiIsConfirm(true);
    const zero = 0;
    await methods
      .send(
        farmingContract.methods.claimBoostReward,
        [zero.toString(10)],
        address
      )
      .then(res => {
        setTxhash(res.transactionHash);
        setiIsConfirm(false);
        setIsSuccess(true);
        setTextSuccess('Claim Boost Reward successfully');
      })
      .catch(err => {
        if (err.message.includes('User denied')) {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Decline transaction');
        } else {
          setIsShowCancel(true);
          setiIsConfirm(false);
          setTextErr('Some thing went wrong!');
        }
        throw err;
      });
  };

  // Stake NFT
  const handleStakeDialog = useCallback(
    async (value, event, checked, mess) => {
      if (!value) {
        return;
      }
      if (mess) {
        return;
      }
      if (value && event.isTrusted) {
        setiIsConfirm(true);
        setIsStakeNFT(false);
        await methods
          .send(
            checked
              ? farmingContract.methods.boostPartially
              : farmingContract.methods.boost,
            [0, value.toString(10)],
            address
          )
          .then(res => {
            setTxhash(res.transactionHash);
            setTextSuccess('Stake NFT successfully');
            setiIsConfirm(false);
            setIsSuccess(true);
            setValueNFTStake('');
            setItemStaking([]);
          })
          .catch(err => {
            if (err.message.includes('User denied')) {
              setIsShowCancel(true);
              setiIsConfirm(false);
              setTextErr('Decline transaction');
              setValueNFTStake('');
            } else {
              setIsShowCancel(true);
              setiIsConfirm(false);
              setTextErr('Some thing went wrong!');
              setValueNFTStake('');
            }
            throw err;
          });
      }
    },
    [dataNFT]
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
        await methods
          .send(
            checked
              ? farmingContract.methods.unBoostPartially
              : farmingContract.methods.unBoost,
            [0, value.toString(10)],
            address
          )
          .then(res => {
            setTxhash(res.transactionHash);
            setTextSuccess('Unstake NFT successfully');
            setiIsConfirm(false);
            setIsSuccess(true);
            setValueNFTUnStake('');
            setItemStaked([]);
          })
          .catch(err => {
            if (err.message.includes('User denied')) {
              setValueNFTUnStake('');
              setIsShowCancel(true);
              setiIsConfirm(false);
              setTextErr('Decline transaction');
            } else {
              setValueNFTUnStake('');
              setIsShowCancel(true);
              setiIsConfirm(false);
              setTextErr('Some thing went wrong!');
            }
            throw err;
          });
      }
    },
    []
  );
  // handleOpen
  const handleStakeNFT = () => {
    setIsStakeNFT(true);
  };
  const handleUnStakeNFT = () => {
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

  // change accounts
  useEffect(() => {
    if (!address) {
      return;
    }
    if (window.ethereum) {
      // && checkIsValidNetwork()
      window.ethereum.on('accountsChanged', acc => {
        setSetting({
          selectedAddress: acc[0],
          accountLoading: true
        });
      });
    }
  }, [window.ethereum, address]);
  return (
    <>
      <React.Fragment>
        <MainLayout>
          <ST.SMain>
            <ST.SHr />
            <Row className="all-section">
              <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                <DashboardStaking amount={countNFT} address={address} />
                <ST.SDivPadding>
                  <ST.SHeader>
                    <ST.STextModel>Interest Rate Model</ST.STextModel>
                    <ST.SHref target="_blank" href={constants.SUPPORT_URL}>
                      Get STRK-ETH LPs
                      <ST.SImgErr src={IconLinkBlue} />
                    </ST.SHref>
                  </ST.SHeader>

                  <Row>
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
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
                          placeholder="Enter a number"
                          onChange={event => handleChangeValue(event)}
                        />
                        {messErr?.show === true && (
                          <ST.SError>{messErr.mess}</ST.SError>
                        )}
                        {messErr?.noLP === true && (
                          <ST.SLinkErr>
                            {messErr.mess}
                            <ST.SLinkErr
                              target="_blank"
                              href={constants.SUPPORT_URL}
                            >
                              <ST.SImgErr src={IconLink} />
                            </ST.SLinkErr>
                          </ST.SLinkErr>
                        )}
                      </ST.SInput>
                    </Col>
                  </Row>
                  <ST.SBoxOne>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <ST.SInfor>
                          <ST.SInforText>Available</ST.SInforText>
                          {address ? (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              {userInfo.available ?? '0.0'}
                              <ST.SMax
                                disabled={userInfo.availableNumber === 0}
                                onClick={handleMaxValue}
                              >
                                MAX
                              </ST.SMax>
                            </ST.SInforValue>
                          ) : (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              -
                              <ST.SMax
                                disabled={userInfo.availableNumber === 0}
                                onClick={handleMaxValue}
                              >
                                MAX
                              </ST.SMax>
                            </ST.SInforValue>
                          )}
                        </ST.SInfor>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <Row>
                          <ST.SRowColumn>
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
                                                Stake
                                              </ST.SBtnStake>
                                              <Tooltip
                                                placement="right"
                                                title="Countdown time will be reset if you stake more without claiming the rewards"
                                              >
                                                <ST.SQuestion
                                                  src={IconQuestion}
                                                />
                                              </Tooltip>
                                            </ST.SBtnUnStakeStart>
                                          </Col>
                                          <Col
                                            xs={{ span: 24 }}
                                            lg={{ span: 8 }}
                                          >
                                            {}
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
                                                    Loading...
                                                  </ST.SBtnLoadding>
                                                  <Tooltip
                                                    placement="right"
                                                    title="Countdown time will be reset if you stake more without claiming the rewards"
                                                  >
                                                    <ST.SQuestion
                                                      src={IconQuestion}
                                                    />
                                                  </Tooltip>
                                                </ST.SBtnUnStakeStart>
                                              </Col>
                                              <Col
                                                xs={{ span: 24 }}
                                                lg={{ span: 8 }}
                                              >
                                                {}
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
                                                    Stake
                                                  </ST.SBtnStake>
                                                  <Tooltip
                                                    placement="right"
                                                    title="Countdown time will be reset if you stake more without claiming the rewards"
                                                  >
                                                    <ST.SQuestion
                                                      src={IconQuestion}
                                                    />
                                                  </Tooltip>
                                                </ST.SBtnUnStakeStart>
                                              </Col>
                                              <Col
                                                xs={{ span: 24 }}
                                                lg={{ span: 8 }}
                                              >
                                                {}
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
                            {address &&
                            userInfo.availableNumber &&
                            !isApproveLP ? (
                              <>
                                <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                  <ST.SBtn>
                                    {!isApproveLP ? (
                                      <>
                                        {' '}
                                        <ST.SBtnStake onClick={handleApproveLp}>
                                          Approve Staking
                                        </ST.SBtnStake>
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </ST.SBtn>
                                </Col>
                              </>
                            ) : (
                              <>
                                <></>
                              </>
                            )}
                          </ST.SRowColumn>
                        </Row>
                      </Col>
                    </Row>
                  </ST.SBoxOne>
                  <ST.SBoxOne>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <ST.SInforNotBorder>
                          <ST.SInforText>Staked</ST.SInforText>
                          {address ? (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              {userInfo.amount ?? '0.0'}
                              <ST.SMax
                                disabled={userInfo.amountNumber === 0}
                                onClick={handleMaxValueStaked}
                              >
                                MAX
                              </ST.SMax>
                            </ST.SInforValue>
                          ) : (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                                <ST.SImgLpSmall src={IconLpSmall} />
                              </ST.SIconSmall>
                              -
                              <ST.SMax
                                disabled={userInfo.amountNumber === 0}
                                onClick={handleMaxValueStaked}
                              >
                                MAX
                              </ST.SMax>
                            </ST.SInforValue>
                          )}
                        </ST.SInforNotBorder>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        {/* Unstake lp */}
                        <ST.SBoxUnState>
                          <Col xs={{ span: 24 }} lg={{ span: 24 }}>
                            {address && isApproveLP && (
                              <ST.SBtnUn>
                                {isUnStakeLp ? (
                                  <>
                                    {isAprroveVstrk ? (
                                      <>
                                        {isLoadingUnStake ? (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 12 }}
                                            >
                                              <ST.SBtnUnStakeStart>
                                                <ST.SBtnLoadding disabled>
                                                  Loading...
                                                </ST.SBtnLoadding>
                                                <Tooltip
                                                  placement="right"
                                                  title="Countdown time will be reset if you unstake a part without claiming the rewards"
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStart>
                                            </Col>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 8 }}
                                            >
                                              {}
                                            </Col>
                                          </>
                                        ) : (
                                          <>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 12 }}
                                            >
                                              <ST.SBtnUnStakeStart>
                                                <ST.SBtnUnstake
                                                  disabled={
                                                    disabledBtnUn ||
                                                    Number(val) === 0
                                                  }
                                                  onClick={handleUnStake}
                                                >
                                                  UnStake
                                                </ST.SBtnUnstake>
                                                <Tooltip
                                                  placement="right"
                                                  title="Countdown time will be reset if you unstake a part without claiming the rewards"
                                                >
                                                  <ST.SQuestion
                                                    src={IconQuestion}
                                                  />
                                                </Tooltip>
                                              </ST.SBtnUnStakeStart>
                                            </Col>
                                            <Col
                                              xs={{ span: 24 }}
                                              lg={{ span: 8 }}
                                            >
                                              {}
                                            </Col>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Col
                                          xs={{ span: 24 }}
                                          lg={{ span: 12 }}
                                        >
                                          <ST.SBtnUnStakeStart>
                                            <ST.SBtnStake
                                              onClick={handleApproveVstrk}
                                            >
                                              Approve Staking
                                            </ST.SBtnStake>
                                            <Tooltip
                                              placement="right"
                                              title="Countdown time will be reset if you unstake a part without claiming the rewards"
                                            >
                                              <ST.SQuestion
                                                src={IconQuestion}
                                              />
                                            </Tooltip>
                                          </ST.SBtnUnStakeStart>
                                        </Col>
                                        <Col xs={{ span: 24 }} lg={{ span: 8 }}>
                                          {}
                                        </Col>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                                      <ST.SBtnUnStakeStart>
                                        <ST.SSUnTake disabled>
                                          UnStake
                                        </ST.SSUnTake>
                                        <Tooltip
                                          placement="right"
                                          title="Countdown time will be reset if you unstake a part without claiming the rewards"
                                        >
                                          <ST.SQuestion src={IconQuestion} />
                                        </Tooltip>
                                      </ST.SBtnUnStakeStart>
                                    </Col>
                                    <Col xs={{ span: 24 }} lg={{ span: 8 }}>
                                      {expiryTimeUnstakeLP > 0 &&
                                      userInfo.amount > 0 &&
                                      address &&
                                      isApproveLP ? (
                                        <CountDownClaim
                                          times={expiryTimeUnstakeLP}
                                          address={address}
                                        />
                                      ) : (
                                        <></>
                                      )}
                                    </Col>
                                  </>
                                )}
                              </ST.SBtnUn>
                            )}
                          </Col>
                        </ST.SBoxUnState>
                      </Col>
                    </Row>
                  </ST.SBoxOne>
                </ST.SDivPadding>
                <ST.SDivPaddingMT>
                  <ST.SDivHarvest>
                    <ST.SText>STRK-ETH Harvest</ST.SText>
                  </ST.SDivHarvest>
                  {/* Claim base */}
                  <ST.SBoxHarvest>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <ST.SInforClaim>
                          <ST.SInforText>Base Reward</ST.SInforText>
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
                        </ST.SInforClaim>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <Row>
                          <ST.SBoxState>
                            <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                              {address && isApproveLP && (
                                <ST.SBtnClaim>
                                  {isClaimBaseReward ? (
                                    <ST.SClaim onClick={handleClainBaseReward}>
                                      Claim
                                    </ST.SClaim>
                                  ) : (
                                    <ST.SUnClaim>Claim</ST.SUnClaim>
                                  )}
                                  <Tooltip
                                    placement="right"
                                    title="You can only claim reward once daily"
                                  >
                                    <ST.SQuestionClaim src={IconQuestion} />
                                  </Tooltip>
                                </ST.SBtnClaim>
                              )}
                            </Col>
                            <Col xs={{ span: 24 }} lg={{ span: 8 }}>
                              {expiryTimeBase && address && isApproveLP ? (
                                <CountDownClaim
                                  times={expiryTimeBase}
                                  address={address}
                                />
                              ) : (
                                <></>
                              )}
                            </Col>
                          </ST.SBoxState>
                        </Row>
                      </Col>
                    </Row>
                  </ST.SBoxHarvest>

                  {/* Claim boost */}
                  <ST.SBoxHarvest>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <ST.SInforClaim>
                          <ST.SInforText>Boost Reward</ST.SInforText>
                          {address ? (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                              </ST.SIconSmall>
                              {userInfo.accBoostReward ?? '0.0'}
                            </ST.SInforValue>
                          ) : (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgFlashSmall src={IconFlashSmall} />
                              </ST.SIconSmall>
                              -
                            </ST.SInforValue>
                          )}
                        </ST.SInforClaim>
                      </Col>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <Row>
                          <ST.SBoxState>
                            <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                              {address && isApproveLP && (
                                <ST.SBtnClaimStart>
                                  {isClaimBootReward ? (
                                    <ST.SClaim onClick={handleClainBootReward}>
                                      Claim
                                    </ST.SClaim>
                                  ) : (
                                    <ST.SUnClaim>Claim</ST.SUnClaim>
                                  )}
                                  <Tooltip
                                    placement="right"
                                    title="You can only claim reward once monthly"
                                  >
                                    <ST.SQuestionClaim src={IconQuestion} />
                                  </Tooltip>
                                </ST.SBtnClaimStart>
                              )}
                            </Col>
                            <Col xs={{ span: 24 }} lg={{ span: 8 }}>
                              {expiryTimeBoost && address && isApproveLP ? (
                                <CountDownClaim
                                  times={expiryTimeBoost}
                                  address={address}
                                />
                              ) : (
                                <></>
                              )}
                            </Col>
                          </ST.SBoxState>
                        </Row>
                      </Col>
                    </Row>
                  </ST.SBoxHarvest>

                  {/* vstrk */}
                  <ST.SBoxHarvest>
                    <Row>
                      <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <ST.SInforClaimNoBorder>
                          <ST.SInforText>
                            vSTRK claimed
                            <ST.SVSTRKTootip>
                              <Tooltip
                                placement="right"
                                title="vSTRK is auto-claimed to your wallet 
                              (10 vSTRK is minted for each STRK-ETH to stake)"
                              >
                                <ST.SQuestion src={IconQuestion} />
                              </Tooltip>
                            </ST.SVSTRKTootip>
                          </ST.SInforText>
                          {address ? (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgLpSmall src={IconVstrkSmall} />
                              </ST.SIconSmall>
                              {userInfo.vStrk ?? '0.0'}
                            </ST.SInforValue>
                          ) : (
                            <ST.SInforValue>
                              <ST.SIconSmall>
                                <ST.SImgLpSmall src={IconVstrkSmall} />
                              </ST.SIconSmall>
                              -
                            </ST.SInforValue>
                          )}
                        </ST.SInforClaimNoBorder>
                      </Col>
                    </Row>
                  </ST.SBoxHarvest>
                </ST.SDivPaddingMT>
                <ST.SDiv>
                  <Row>
                    <ST.SRowFlex>
                      <ST.SFlex>
                        <ST.SText>
                          NFT Staking
                          {address ? (
                            <>
                              <Tooltip
                                placement="right"
                                title="Only display all NFTs that can be staked into this pool"
                              >
                                <ST.SQuestion src={IconQuestion} />
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip
                              placement="right"
                              title="Connect wallet to see your NFTs"
                            >
                              <ST.SQuestion src={IconQuestion} />
                            </Tooltip>
                          )}
                        </ST.SText>
                      </ST.SFlex>
                      <ST.SFlexEnd>
                        {address && dataNFT.length > 0 ? (
                          <>
                            {isApproveNFT ? (
                              <>
                                <ST.SSTake
                                  disabled={
                                    itemStaking.length === MAX_STAKE_NFT
                                  }
                                  onClick={handleStakeNFT}
                                >
                                  Stake
                                </ST.SSTake>
                              </>
                            ) : (
                              <>
                                <ST.SSTake onClick={handleApproveNFT}>
                                  Approve Staking
                                </ST.SSTake>
                              </>
                            )}
                          </>
                        ) : (
                          <> </>
                        )}
                      </ST.SFlexEnd>
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
                              {address
                                ? 'You don’t own any NFTs'
                                : 'Connect wallet to see your NFTs'}
                            </ST.SSliderNoDataText>
                          </ST.SSliderNoData>
                        )}

                        <Slider {...AUDITOR_SETTING}>
                          {dataNFT?.map(item => {
                            return (
                              <ST.SItemSlider key={item.id}>
                                <ST.SImgSlider src={item.img} />
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
                    <ST.SRowFlex>
                      <ST.SFlex>
                        <ST.SText>NFT staked</ST.SText>
                      </ST.SFlex>
                      <ST.SFlexEnd>
                        <ST.SDetailsColor>
                          {' '}
                          Your Boost APR: {yourBoostAPR}%{' '}
                        </ST.SDetailsColor>
                      </ST.SFlexEnd>
                    </ST.SRowFlex>
                  </Row>
                  <Row>
                    <ST.SFlexEnd>
                      {address && dataNFTUnState.length > 0 ? (
                        <>
                          {isApproveNFT ? (
                            <>
                              <ST.SSTaked onClick={handleUnStakeNFT}>
                                UnStake
                              </ST.SSTaked>
                            </>
                          ) : (
                            <>
                              <ST.SSTaked onClick={handleApproveNFT}>
                                Approve Staking
                              </ST.SSTaked>
                            </>
                          )}
                        </>
                      ) : (
                        <></>
                      )}
                    </ST.SFlexEnd>
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
                              {address
                                ? 'You don’t own any NFTs'
                                : 'Connect wallet to see your NFTs'}
                            </ST.SSliderNoDataText>
                          </ST.SSliderNoData>
                        )}
                        <Slider {...AUDITOR_SETTING}>
                          {dataNFTUnState &&
                            dataNFTUnState?.map(item => {
                              return (
                                <ST.SItemSlider key={item.id}>
                                  <ST.SImgSlider src={item.img} />
                                  <ST.SBoxSlider>
                                    <ST.STitleSlider>
                                      {item.name}
                                    </ST.STitleSlider>
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
        />
        {/* err */}
        <DialogErr
          isShow={isShowCancel}
          close={handleCloseErr}
          text={textErr}
        />
        {/* Confirm */}
        <DialogConfirm isConfirm={isConfirm} close={handleCloseConfirm} />
        <DialogSuccess
          isSuccess={isSuccess}
          close={handleCloseSuccess}
          address={settings?.selectedAddress}
          text={textSuccess}
          txh={txhash}
        />
      </React.Fragment>
    </>
  );
}
Staking.propTypes = {
  settings: PropTypes.object,
  setSetting: PropTypes.func.isRequired
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

export default compose(
  withRouter,
  connectAccount(mapStateToProps, mapDispatchToProps)
)(Staking);
